"""
generate_mock_dataset.py
========================
Generates a controlled synthetic dataset for algorithm testing.

IMPORTANT: These are NOT real weed/crop images.
They are programmatically created software test objects used to
validate the vision pipeline under controlled conditions.

All images in this dataset are labelled:
  SYNTHETIC / MOCK / SIMULATION-ONLY

Dataset composition (configurable in config.py)
------------------------------------------------
  35 weed-like targets   - green blobs, blob-like shapes
  35 crop-like images    - elongated green shapes (high aspect ratio)
  20 background images   - soil/background only (no green targets)

Variations introduced
---------------------
  - target position
  - target size
  - target orientation
  - background brightness
  - colour variation
  - number of objects
  - Gaussian image noise
  - illumination variation / vignette
  - soft shadow overlay
  - shape type (ellipse, irregular polygon)

Outputs
-------
  data/mock_images/      - PNG images
  data/labels/mock_labels.csv - metadata for each image
"""

import os
import csv
import random
import math
import numpy as np
import cv2
import config as cfg

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
random.seed(cfg.RANDOM_SEED)
np.random.seed(cfg.RANDOM_SEED)

W = cfg.IMAGE_WIDTH
H = cfg.IMAGE_HEIGHT

LABEL_COLUMNS = [
    "filename", "ground_truth_class", "target_present",
    "target_area", "target_center_x", "target_center_y",
    "synthetic_scene_type", "note"
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_soil_background(brightness: float = 0.5) -> np.ndarray:
    """
    Create a synthetic soil-coloured background (brownish).

    brightness - float in [0.3, 0.9] controls how light/dark the background is
    """
    # Base soil colour: brownish-grey but significantly brighter
    base_b = int(brightness * 110)
    base_g = int(brightness * 140)
    base_r = int(brightness * 160)

    img = np.full((H, W, 3), [base_b, base_g, base_r], dtype=np.uint8)

    # Add low-level random texture
    noise = np.random.randint(-20, 20, (H, W, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img


def _add_gaussian_noise(img: np.ndarray, sigma: float = 8.0) -> np.ndarray:
    """Add Gaussian noise to simulate camera sensor noise."""
    noise = np.random.normal(0, sigma, img.shape).astype(np.int16)
    return np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def _add_vignette(img: np.ndarray, strength: float = 0.3) -> np.ndarray:
    """Apply radial vignette to simulate lens illumination falloff."""
    rows, cols = img.shape[:2]
    X = np.linspace(-1, 1, cols)
    Y = np.linspace(-1, 1, rows)
    Xg, Yg = np.meshgrid(X, Y)
    vignette = 1.0 - strength * (Xg**2 + Yg**2)
    vignette = np.clip(vignette, 0, 1)
    for c in range(3):
        img[:, :, c] = (img[:, :, c] * vignette).astype(np.uint8)
    return img


def _add_shadow(img: np.ndarray) -> np.ndarray:
    """Add a soft diagonal shadow to simulate outdoor partial shadow."""
    shadow_mask = np.ones((H, W), dtype=np.float32)
    x_split = random.randint(W // 4, 3 * W // 4)
    shadow_mask[:, :x_split] = 0.8   # significantly less dark
    shadow_mask = cv2.GaussianBlur(shadow_mask, (121, 121), 0)
    for c in range(3):
        img[:, :, c] = (img[:, :, c] * shadow_mask).astype(np.uint8)
    return img


def _draw_weed_blob(img: np.ndarray, cx: int, cy: int,
                    radius: int, color_jitter: int = 15) -> int:
    """
    Draw a weed-like irregular green blob.

    Returns the approximate pixel area of the drawn object.
    """
    # Base green colour with jitter
    green_b = random.randint(20, 60)
    green_g = random.randint(120, 200) + color_jitter
    green_r = random.randint(20, 60)

    # Draw irregular polygon approximating a leaf/rosette shape
    n_pts = random.randint(6, 12)
    pts = []
    for i in range(n_pts):
        angle = 2 * math.pi * i / n_pts
        r_rand = radius * random.uniform(0.6, 1.4)
        px = int(cx + r_rand * math.cos(angle))
        py = int(cy + r_rand * math.sin(angle))
        pts.append([px, py])
    pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))

    # Create a temporary mask to compute area
    temp = np.zeros((H, W), dtype=np.uint8)
    cv2.fillPoly(temp, [pts_arr], 255)
    area = int(np.sum(temp > 0))

    cv2.fillPoly(img, [pts_arr], (green_b, green_g, green_r))

    # Add a slightly darker centre for texture
    cv2.circle(img, (cx, cy), max(3, radius // 4),
               (green_b, green_g - 20, green_r), -1)

    return area


def _draw_crop_shape(img: np.ndarray, cx: int, cy: int,
                     length: int, width: int, angle_deg: float) -> int:
    """
    Draw a crop-like elongated green shape (leaf / blade).

    Returns approximate pixel area.
    """
    green_b = random.randint(10, 40)
    green_g = random.randint(100, 160)
    green_r = random.randint(10, 40)

    # Rotated rectangle as leaf proxy
    rect = ((cx, cy), (length, width), angle_deg)
    box = cv2.boxPoints(rect)
    box = np.intp(box)

    temp = np.zeros((H, W), dtype=np.uint8)
    cv2.fillPoly(temp, [box], 255)
    area = int(np.sum(temp > 0))

    cv2.fillPoly(img, [box], (green_b, green_g, green_r))
    return area


# ---------------------------------------------------------------------------
# Image generators
# ---------------------------------------------------------------------------

def generate_weed_image(idx: int) -> dict:
    """
    Generate a single weed-like synthetic image.

    Returns metadata dictionary.
    """
    brightness = random.uniform(0.65, 1.0)
    img = _make_soil_background(brightness)

    # Random number of weed blobs (1 to 3)
    n_blobs = random.randint(1, 3)

    total_area = 0
    first_cx, first_cy = W // 2, H // 2

    for blob_i in range(n_blobs):
        # Random position within safe margins
        margin = 60
        cx = random.randint(margin, W - margin)
        cy = random.randint(margin, H - margin)
        radius = random.randint(25, 80)

        area = _draw_weed_blob(img, cx, cy, radius,
                               color_jitter=random.randint(-15, 15))
        total_area += area
        if blob_i == 0:
            first_cx, first_cy = cx, cy

    # Augmentations
    if random.random() < 0.4:
        img = _add_shadow(img)
    if random.random() < 0.3:
        img = _add_vignette(img, strength=random.uniform(0.15, 0.4))
    img = _add_gaussian_noise(img, sigma=random.uniform(3, 12))

    filename = f"weed_{idx:04d}.png"
    cv2.imwrite(os.path.join(cfg.MOCK_IMAGE_DIR, filename), img)

    return {
        "filename": filename,
        "ground_truth_class": "weed",
        "target_present": True,
        "target_area": total_area,
        "target_center_x": first_cx,
        "target_center_y": first_cy,
        "synthetic_scene_type": "weed_blob",
        "note": "SYNTHETIC - SIMULATION ONLY"
    }


def generate_crop_image(idx: int) -> dict:
    """
    Generate a single crop-like synthetic image.

    Crop targets are elongated (high aspect ratio).
    The shape cue is designed to reject these in many cases.
    """
    brightness = random.uniform(0.65, 1.0)
    img = _make_soil_background(brightness)

    n_crops = random.randint(1, 4)
    total_area = 0
    first_cx, first_cy = W // 2, H // 2

    for ci in range(n_crops):
        margin = 80
        cx = random.randint(margin, W - margin)
        cy = random.randint(margin, H - margin)
        length = random.randint(80, 180)     # long axis
        width  = random.randint(10, 30)      # short axis (high aspect ratio)
        angle  = random.uniform(0, 180)

        area = _draw_crop_shape(img, cx, cy, length, width, angle)
        total_area += area
        if ci == 0:
            first_cx, first_cy = cx, cy

    if random.random() < 0.3:
        img = _add_shadow(img)
    if random.random() < 0.3:
        img = _add_vignette(img)
    img = _add_gaussian_noise(img, sigma=random.uniform(3, 12))

    filename = f"crop_{idx:04d}.png"
    cv2.imwrite(os.path.join(cfg.MOCK_IMAGE_DIR, filename), img)

    return {
        "filename": filename,
        "ground_truth_class": "crop",
        "target_present": True,
        "target_area": total_area,
        "target_center_x": first_cx,
        "target_center_y": first_cy,
        "synthetic_scene_type": "elongated_blade",
        "note": "SYNTHETIC - SIMULATION ONLY"
    }


def generate_background_image(idx: int) -> dict:
    """Generate a background-only image (soil, no green targets)."""
    brightness = random.uniform(0.65, 1.0)
    img = _make_soil_background(brightness)

    if random.random() < 0.5:
        img = _add_shadow(img)
    if random.random() < 0.4:
        img = _add_vignette(img)
    img = _add_gaussian_noise(img, sigma=random.uniform(5, 18))

    filename = f"bg_{idx:04d}.png"
    cv2.imwrite(os.path.join(cfg.MOCK_IMAGE_DIR, filename), img)

    return {
        "filename": filename,
        "ground_truth_class": "background",
        "target_present": False,
        "target_area": 0,
        "target_center_x": 0,
        "target_center_y": 0,
        "synthetic_scene_type": "soil_only",
        "note": "SYNTHETIC - SIMULATION ONLY"
    }


# ---------------------------------------------------------------------------
# TYPE HINT SHIM
# ---------------------------------------------------------------------------
# (Python 3.8 compatible; remove if using 3.10+)
from typing import Tuple


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    os.makedirs(cfg.MOCK_IMAGE_DIR, exist_ok=True)
    os.makedirs(cfg.LABEL_DIR, exist_ok=True)

    records = []

    print(f"Generating {cfg.N_WEED_IMAGES} weed images...")
    for i in range(cfg.N_WEED_IMAGES):
        records.append(generate_weed_image(i))

    print(f"Generating {cfg.N_CROP_IMAGES} crop images...")
    for i in range(cfg.N_CROP_IMAGES):
        records.append(generate_crop_image(i))

    print(f"Generating {cfg.N_BG_IMAGES} background images...")
    for i in range(cfg.N_BG_IMAGES):
        records.append(generate_background_image(i))

    # Write CSV labels
    with open(cfg.MOCK_LABELS_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LABEL_COLUMNS)
        writer.writeheader()
        writer.writerows(records)

    print(f"\n[SIMULATION-ONLY] Dataset generated:")
    print(f"  Images : {len(records)} -> {cfg.MOCK_IMAGE_DIR}")
    print(f"  Labels : {cfg.MOCK_LABELS_CSV}")
    print("\nNote: All images are synthetic software test objects.")
    print("      They do NOT represent real agricultural scenes.")


if __name__ == "__main__":
    main()
