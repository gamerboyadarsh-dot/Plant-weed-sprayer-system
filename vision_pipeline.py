"""
vision_pipeline.py
==================
Core computer-vision pipeline for the Precision Micro-Dosing Weed Sprayer.

Pipeline stages
---------------
1.  Load & resize image
2.  BGR -> RGB conversion
3.  Normalised-channel computation (r, g, b)
4.  Excess Green Index:  ExG = 2g − r − b
5.  Threshold -> binary vegetation mask
6.  Morphological opening  (noise removal)
7.  Morphological closing  (hole filling)
8.  Small-blob removal
9.  Contour detection
10. Per-contour feature extraction
11. Candidate filtering
12. Dual-cue confirmation gate
13. Size-scaled burst-duration calculation
14. Estimated liquid-volume calculation

All parameters are read from config.py.
No deep-learning model is used at this stage.
(MobileNet/YOLO noted as a possible future upgrade.)
"""

import cv2
import numpy as np
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import config as cfg

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DATA CLASSES
# ---------------------------------------------------------------------------

@dataclass
class ContourFeatures:
    """All geometric and colour features extracted from a single contour."""
    contour_id:       int
    area:             float   # px2
    perimeter:        float   # px
    cx:               float   # centroid x
    cy:               float   # centroid y
    bb_x:             int     # bounding-box top-left x
    bb_y:             int     # bounding-box top-left y
    bb_w:             int     # bounding-box width
    bb_h:             int     # bounding-box height
    aspect_ratio:     float   # width / height
    extent:           float   # area / bb_area
    solidity:         float   # area / convex_hull_area
    circularity:      float   # 4pi·area / perimeter2
    mean_exg:         float   # mean ExG inside contour mask
    bb_area:          float   # bounding-box area (px2)
    hull_area:        float   # convex hull area (px2)


@dataclass
class DetectionResult:
    """Complete result for one detected candidate."""
    features:     ContourFeatures
    colour_cue:   bool   # ExG-based vegetation cue
    shape_cue:    bool   # Geometry-based shape cue
    decision:     str    # "FIRE" or "SUPPRESS"
    burst_ms:     float  # size-scaled burst duration (ms)
    volume_ml:    float  # estimated liquid volume (mL)


@dataclass
class PipelineOutput:
    """Full output of one image processed through the pipeline."""
    image_name:   str
    original:     np.ndarray              # HxWx3 BGR
    rgb:          np.ndarray              # HxWx3 float32 [0,1]
    exg_map:      np.ndarray              # HxW float32
    veg_mask:     np.ndarray              # HxW uint8 binary (before morph)
    clean_mask:   np.ndarray              # HxW uint8 binary (after morph)
    detections:   List[DetectionResult]  = field(default_factory=list)
    error:        Optional[str]          = None


# ---------------------------------------------------------------------------
# STEP 1 - IMAGE LOADING
# ---------------------------------------------------------------------------

def load_image(path: str) -> Optional[np.ndarray]:
    """
    Load an image from disk.

    Returns None on failure (handles missing / unreadable files gracefully).
    """
    img = cv2.imread(path)
    if img is None:
        logger.warning(f"Could not read image: {path}")
        return None
    return img


# ---------------------------------------------------------------------------
# STEP 2 - RESIZE
# ---------------------------------------------------------------------------

def resize_image(img: np.ndarray, w: int = cfg.IMAGE_WIDTH,
                 h: int = cfg.IMAGE_HEIGHT) -> np.ndarray:
    """Resize to (w, h) using bilinear interpolation."""
    return cv2.resize(img, (w, h), interpolation=cv2.INTER_LINEAR)


# ---------------------------------------------------------------------------
# STEP 3 - BGR -> float32 RGB
# ---------------------------------------------------------------------------

def bgr_to_rgb_float(img: np.ndarray) -> np.ndarray:
    """Convert BGR uint8 -> RGB float32 in [0, 1]."""
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return rgb.astype(np.float32) / 255.0


# ---------------------------------------------------------------------------
# STEP 4 - EXCESS GREEN INDEX
# ---------------------------------------------------------------------------

def compute_exg(rgb: np.ndarray) -> np.ndarray:
    """
    Compute the normalised Excess Green Index.

    Normalised channel values:
        r = R / (R + G + B)
        g = G / (R + G + B)
        b = B / (R + G + B)

    ExG = 2g − r − b

    Division by zero is handled by adding a small epsilon.

    Returns
    -------
    exg : np.ndarray  float32, same HxW as input
        Values typically range from −1 to +1.
        Positive values -> green-biased vegetation.
    """
    R = rgb[:, :, 0]
    G = rgb[:, :, 1]
    B = rgb[:, :, 2]

    # Sum of channels (avoid divide-by-zero with epsilon)
    total = R + G + B + 1e-6   # epsilon prevents division by zero

    r = R / total
    g = G / total
    b = B / total

    exg = 2.0 * g - r - b          # Excess Green Index
    return exg.astype(np.float32)


# ---------------------------------------------------------------------------
# STEP 5 - THRESHOLD
# ---------------------------------------------------------------------------

def threshold_exg(exg: np.ndarray, threshold: float = cfg.EXG_THRESHOLD) -> np.ndarray:
    """
    Convert ExG float map -> binary vegetation mask.

    Pixels where ExG > threshold are set to 255 (vegetation).
    All others are set to 0 (background).
    """
    mask = np.where(exg > threshold, 255, 0).astype(np.uint8)
    return mask


# ---------------------------------------------------------------------------
# STEP 6 & 7 - MORPHOLOGICAL CLEANUP
# ---------------------------------------------------------------------------

def morphological_cleanup(mask: np.ndarray) -> np.ndarray:
    """
    Apply morphological opening then closing to the binary mask.

    Opening  - erodes then dilates -> removes small noise specks
    Closing  - dilates then erodes -> fills small holes inside objects
    """
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (cfg.MORPH_KERNEL_SIZE, cfg.MORPH_KERNEL_SIZE)
    )
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel,
                               iterations=cfg.MORPH_OPEN_ITER)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel,
                               iterations=cfg.MORPH_CLOSE_ITER)
    return closed


# ---------------------------------------------------------------------------
# STEP 8 - SMALL BLOB REMOVAL
# ---------------------------------------------------------------------------

def remove_small_blobs(mask: np.ndarray,
                        min_area: int = cfg.MIN_BLOB_AREA) -> np.ndarray:
    """
    Remove connected components smaller than min_area pixels.
    Prevents tiny noise patches from reaching the contour stage.
    """
    n_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    clean = np.zeros_like(mask)
    for i in range(1, n_labels):   # skip background label 0
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            clean[labels == i] = 255
    return clean


# ---------------------------------------------------------------------------
# GAUSSIAN BLUR (OPTIONAL)
# ---------------------------------------------------------------------------

def apply_blur(img: np.ndarray) -> np.ndarray:
    """Optional Gaussian smoothing to reduce camera noise."""
    k = cfg.BLUR_KERNEL_SIZE
    if k <= 0:
        return img
    if k % 2 == 0:
        k += 1   # kernel must be odd
    return cv2.GaussianBlur(img, (k, k), 0)


# ---------------------------------------------------------------------------
# STEP 9 - CONTOUR DETECTION
# ---------------------------------------------------------------------------

def find_contours(mask: np.ndarray):
    """
    Find external contours in the binary mask.

    Returns list of contours (each is an Nx1x2 array).
    Uses RETR_EXTERNAL to retrieve only outermost boundaries.
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)
    return contours


# ---------------------------------------------------------------------------
# STEP 10 - PER-CONTOUR FEATURE EXTRACTION
# ---------------------------------------------------------------------------

def extract_features(contour, contour_id: int,
                     exg_map: np.ndarray) -> ContourFeatures:
    """
    Extract geometric and colour features from a single contour.

    Features computed
    -----------------
    area          - px2
    perimeter     - px (arcLength)
    centroid      - image moments M10/M00, M01/M00
    bounding box  - x, y, w, h
    aspect ratio  - w / h
    extent        - area / (w * h)
    convex hull   - used for solidity
    solidity      - area / hull_area
    circularity   - 4pi·area / perimeter2   (1.0 = perfect circle)
    mean ExG      - average ExG inside the contour mask
    """
    area = cv2.contourArea(contour)

    # Perimeter - safe against degenerate contours
    perimeter = cv2.arcLength(contour, closed=True)
    if perimeter < 1e-6:
        perimeter = 1e-6   # prevent divide-by-zero

    # Moments -> centroid
    M = cv2.moments(contour)
    if M["m00"] > 0:
        cx = M["m10"] / M["m00"]
        cy = M["m01"] / M["m00"]
    else:
        x, y, w, h = cv2.boundingRect(contour)
        cx, cy = x + w / 2, y + h / 2

    # Bounding rectangle
    bb_x, bb_y, bb_w, bb_h = cv2.boundingRect(contour)
    bb_area = float(bb_w * bb_h) if (bb_w * bb_h) > 0 else 1e-6

    # Aspect ratio
    aspect_ratio = bb_w / bb_h if bb_h > 0 else 0.0

    # Extent = contour_area / bounding_box_area
    extent = area / bb_area

    # Convex hull -> solidity
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    if hull_area < 1e-6:
        hull_area = 1e-6
    solidity = area / hull_area

    # Circularity = 4pi·A / P2
    # A perfect circle has circularity = 1.0
    circularity = (4.0 * np.pi * area) / (perimeter ** 2)

    # Mean ExG inside contour mask
    h_img, w_img = exg_map.shape[:2]
    contour_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    cv2.drawContours(contour_mask, [contour], -1, 255, -1)
    mean_vals = cv2.mean(exg_map, mask=contour_mask)
    mean_exg = mean_vals[0]   # single-channel mean

    return ContourFeatures(
        contour_id   = contour_id,
        area         = area,
        perimeter    = perimeter,
        cx           = cx,
        cy           = cy,
        bb_x         = bb_x,
        bb_y         = bb_y,
        bb_w         = bb_w,
        bb_h         = bb_h,
        aspect_ratio = aspect_ratio,
        extent       = extent,
        solidity     = solidity,
        circularity  = circularity,
        mean_exg     = mean_exg,
        bb_area      = bb_area,
        hull_area    = hull_area,
    )


# ---------------------------------------------------------------------------
# STEP 11 - CANDIDATE FILTERING
# ---------------------------------------------------------------------------

def is_candidate(f: ContourFeatures) -> bool:
    """
    Return True if the contour passes all configurable geometric filters.

    These are INITIAL PROOF-OF-CONCEPT thresholds.
    They are NOT experimentally validated weed detection thresholds.
    """
    if f.area < cfg.MIN_CONTOUR_AREA:
        return False
    if f.area > cfg.MAX_CONTOUR_AREA:
        return False
    if f.solidity < cfg.MIN_SOLIDITY:
        return False
    if f.extent < cfg.MIN_EXTENT:
        return False
    if f.aspect_ratio < cfg.MIN_ASPECT_RATIO:
        return False
    if f.aspect_ratio > cfg.MAX_ASPECT_RATIO:
        return False
    if f.mean_exg < cfg.MIN_MEAN_EXG:
        return False
    return True


# ---------------------------------------------------------------------------
# STEP 12 - DUAL-CUE CONFIRMATION GATE
# ---------------------------------------------------------------------------

def colour_cue(f: ContourFeatures) -> bool:
    """
    Colour / vegetation cue.

    Returns True when the mean ExG inside the contour exceeds the threshold.
    This confirms that the region is sufficiently green-biased.

    ExG threshold is a simulation assumption - pending real-world calibration.
    """
    return f.mean_exg >= cfg.MIN_MEAN_EXG


def shape_cue(f: ContourFeatures) -> bool:
    """
    Shape / geometry cue.

    Returns True when the contour satisfies all geometric constraints:
        - area within valid range
        - solidity above minimum (compact shape)
        - circularity above minimum (roundish or blob-like)

    These thresholds are INITIAL PROOF-OF-CONCEPT parameters.
    """
    if f.area < cfg.SHAPE_CUE_MIN_AREA:
        return False
    if f.area > cfg.SHAPE_CUE_MAX_AREA:
        return False
    if f.solidity < cfg.SHAPE_CUE_MIN_SOLIDITY:
        return False
    if f.circularity < cfg.SHAPE_CUE_MIN_CIRCULARITY:
        return False
    return True


def dual_cue_gate(f: ContourFeatures) -> Tuple[bool, bool, str]:
    """
    Dual-Cue Confirmation Gate.

    Truth table
    -----------
    Colour | Shape | Decision
       0   |   0   | SUPPRESS
       0   |   1   | SUPPRESS
       1   |   0   | SUPPRESS
       1   |   1   | FIRE

    Only a target satisfying BOTH cues receives a spray command.

    Returns
    -------
    colour_pass : bool
    shape_pass  : bool
    decision    : "FIRE" | "SUPPRESS"
    """
    c_pass = colour_cue(f)
    s_pass = shape_cue(f)
    decision = "FIRE" if (c_pass and s_pass) else "SUPPRESS"
    return c_pass, s_pass, decision


# ---------------------------------------------------------------------------
# STEP 13 - SIZE-SCALED BURST DURATION
# ---------------------------------------------------------------------------

def compute_burst_ms(area_px: float) -> float:
    """
    Compute size-scaled spray burst duration in milliseconds.

    Formula
    -------
        T_burst = clip( T_MIN + (A / A_REF) x (T_MAX − T_MIN),
                        T_MIN, T_MAX )

    Parameters (all SIMULATION ASSUMPTIONS from config.py)
    -------------------------------------------------------
    T_MIN  - minimum burst duration
    T_MAX  - maximum burst duration
    A_REF  - reference area corresponding to T_MAX

    The formula proportionally scales burst time with target area,
    clamped to [T_MIN, T_MAX].
    """
    t_min = cfg.T_MIN_MS
    t_max = cfg.T_MAX_MS
    a_ref = cfg.A_REF

    raw = t_min + (area_px / a_ref) * (t_max - t_min)
    burst = float(np.clip(raw, t_min, t_max))
    return burst


# ---------------------------------------------------------------------------
# STEP 14 - ESTIMATED LIQUID VOLUME
# ---------------------------------------------------------------------------

def compute_volume_ml(burst_ms: float) -> float:
    """
    Estimate liquid volume dispensed for one spray burst.

    Formula
    -------
        V = Q x (burst_ms / 1000)

    where
        Q           = flow rate in mL/s  [SIMULATION ASSUMPTION]
        burst_ms    = spray duration in milliseconds

    IMPORTANT: Q is a PLACEHOLDER parameter.
    Physical pump calibration is a future hardware integration task.
    """
    q = cfg.FLOW_RATE_ML_S
    volume = q * (burst_ms / 1000.0)
    return volume


# ---------------------------------------------------------------------------
# FULL PIPELINE RUNNER
# ---------------------------------------------------------------------------

def run_pipeline(image_path: str, image_name: str = None) -> PipelineOutput:
    """
    Run the complete vision + decision pipeline on a single image.

    Returns a PipelineOutput containing all intermediate images,
    extracted features, and final decisions.
    """
    if image_name is None:
        import os
        image_name = os.path.basename(image_path)

    # --- Load ---
    bgr = load_image(image_path)
    if bgr is None:
        return PipelineOutput(
            image_name=image_name,
            original=np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3), dtype=np.uint8),
            rgb=np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3), dtype=np.float32),
            exg_map=np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH), dtype=np.float32),
            veg_mask=np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH), dtype=np.uint8),
            clean_mask=np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH), dtype=np.uint8),
            error=f"Could not load image: {image_path}"
        )

    # --- Resize ---
    bgr = resize_image(bgr)

    # --- Optional blur ---
    bgr_blurred = apply_blur(bgr)

    # --- BGR -> RGB float ---
    rgb = bgr_to_rgb_float(bgr_blurred)

    # --- ExG ---
    exg = compute_exg(rgb)

    # --- Threshold ---
    veg_mask = threshold_exg(exg)

    # --- Morphological cleanup ---
    clean_after_morph = morphological_cleanup(veg_mask)

    # --- Remove small blobs ---
    clean_mask = remove_small_blobs(clean_after_morph)

    # --- Contours ---
    contours = find_contours(clean_mask)

    # --- Feature extraction + filtering + decision ---
    detections: List[DetectionResult] = []
    for idx, cnt in enumerate(contours):
        features = extract_features(cnt, idx, exg)
        if not is_candidate(features):
            continue   # skip non-candidate contours silently
        c_pass, s_pass, decision = dual_cue_gate(features)
        if decision == "FIRE":
            burst = compute_burst_ms(features.area)
            volume = compute_volume_ml(burst)
        else:
            burst  = 0.0
            volume = 0.0
        detections.append(DetectionResult(
            features   = features,
            colour_cue = c_pass,
            shape_cue  = s_pass,
            decision   = decision,
            burst_ms   = burst,
            volume_ml  = volume,
        ))

    logger.info(f"{image_name}: {len(detections)} candidates, "
                f"{sum(1 for d in detections if d.decision=='FIRE')} FIRE events")

    return PipelineOutput(
        image_name = image_name,
        original   = bgr,
        rgb        = rgb,
        exg_map    = exg,
        veg_mask   = veg_mask,
        clean_mask = clean_mask,
        detections = detections,
    )
