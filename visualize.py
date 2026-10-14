"""
visualize.py
============
Annotated output image generator and matplotlib plot utilities.

Produces
--------
- annotated BGR image with bounding boxes, centroids, cue labels
- ExG heatmap overlay saved as colourmap PNG
- 3-panel matplotlib figure (original | ExG mask | annotated)
- batch analytics plots

All outputs are SIMULATION VISUALISATIONS - not field results.
"""

import os
import cv2
import numpy as np
import matplotlib
matplotlib.use("Agg")   # headless backend - no display required
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from typing import List

import config as cfg
from vision_pipeline import PipelineOutput, DetectionResult


# ---------------------------------------------------------------------------
# COLOUR CONSTANTS (BGR for OpenCV)
# ---------------------------------------------------------------------------
FIRE_COLOR     = (0,   50, 220)   # red-ish (BGR)
SUPPRESS_COLOR = (200, 140,  0)   # blue-ish (BGR)
TEXT_COLOR     = (255, 255, 255)  # white
BOX_THICKNESS  = 2
FONT           = cv2.FONT_HERSHEY_SIMPLEX
FONT_SCALE     = 0.45
FONT_THICK     = 1


# ---------------------------------------------------------------------------
# ANNOTATED IMAGE
# ---------------------------------------------------------------------------

def annotate_image(out: PipelineOutput) -> np.ndarray:
    """
    Draw bounding boxes, centroids, cue labels, and decision on the image.

    Returns the annotated BGR image (does NOT write to disk).
    """
    img = out.original.copy()

    if not out.detections:
        _put_text(img, "NO CANDIDATES DETECTED", (10, 30), TEXT_COLOR)
        return img

    for det in out.detections:
        f = det.features
        color = FIRE_COLOR if det.decision == "FIRE" else SUPPRESS_COLOR

        # Bounding box
        cv2.rectangle(img,
                      (f.bb_x, f.bb_y),
                      (f.bb_x + f.bb_w, f.bb_y + f.bb_h),
                      color, BOX_THICKNESS)

        # Centroid cross
        cx, cy = int(f.cx), int(f.cy)
        cv2.drawMarker(img, (cx, cy), color,
                       cv2.MARKER_CROSS, 12, 2)

        # Label background + text
        label_lines = [
            f"TARGET #{f.contour_id}",
            f"Area: {int(f.area)} px2",
            f"ExG:  {f.mean_exg:.2f}",
            f"Colour: {'PASS' if det.colour_cue else 'FAIL'}",
            f"Shape:  {'PASS' if det.shape_cue  else 'FAIL'}",
            f">>> {det.decision} <<<",
        ]
        if det.decision == "FIRE":
            label_lines.append(f"Burst: {det.burst_ms:.0f} ms")
            label_lines.append(f"Vol:   {det.volume_ml:.3f} mL")

        ty = f.bb_y - 5
        for line in reversed(label_lines):
            (tw, th), _ = cv2.getTextSize(line, FONT, FONT_SCALE, FONT_THICK)
            ty -= th + 4
            # Background rectangle for readability
            cv2.rectangle(img,
                          (f.bb_x, ty - 2),
                          (f.bb_x + tw + 4, ty + th + 2),
                          (0, 0, 0), -1)
            cv2.putText(img, line,
                        (f.bb_x + 2, ty + th),
                        FONT, FONT_SCALE, color, FONT_THICK, cv2.LINE_AA)

    # Simulation watermark
    _put_text(img, "[SIMULATION ONLY]", (5, H_safe(img) - 8),
              (0, 200, 255), scale=0.4)
    return img


def H_safe(img):
    return img.shape[0]


def _put_text(img, text, pos, color, scale=FONT_SCALE, thick=FONT_THICK):
    cv2.putText(img, text, pos, FONT, scale, (0, 0, 0), thick + 1, cv2.LINE_AA)
    cv2.putText(img, text, pos, FONT, scale, color,   thick,     cv2.LINE_AA)


# ---------------------------------------------------------------------------
# ExG HEATMAP
# ---------------------------------------------------------------------------

def exg_heatmap(exg_map: np.ndarray) -> np.ndarray:
    """
    Convert float32 ExG map to false-colour BGR image (COLORMAP_SUMMER: green=high, blue=low).
    Green = high ExG (vegetation), red = low ExG (soil).
    """
    # Normalise to [0, 255]
    norm = cv2.normalize(exg_map, None, 0, 255, cv2.NORM_MINMAX)
    norm_u8 = norm.astype(np.uint8)
    coloured = cv2.applyColorMap(norm_u8, cv2.COLORMAP_SUMMER)
    return coloured


# ---------------------------------------------------------------------------
# 3-PANEL FIGURE
# ---------------------------------------------------------------------------

def save_detection_figure(out: PipelineOutput, save_path: str) -> None:
    """
    Save a 3-panel matplotlib figure:
      Panel 1 - original image (RGB)
      Panel 2 - clean ExG mask (binary, colourised)
      Panel 3 - annotated detection result
    """
    annotated = annotate_image(out)

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle(
        f"[SIMULATION ONLY]  Weed Sprayer Pipeline - {out.image_name}",
        fontsize=11, fontweight="bold"
    )

    # Panel 1: original
    rgb_disp = cv2.cvtColor(out.original, cv2.COLOR_BGR2RGB)
    axes[0].imshow(rgb_disp)
    axes[0].set_title("Original Image", fontsize=9)
    axes[0].axis("off")

    # Panel 2: ExG binary mask
    mask_coloured = cv2.applyColorMap(out.clean_mask, cv2.COLORMAP_SUMMER)
    mask_rgb = cv2.cvtColor(mask_coloured, cv2.COLOR_BGR2RGB)
    axes[1].imshow(mask_rgb)
    axes[1].set_title(f"ExG Vegetation Mask\n(threshold = {cfg.EXG_THRESHOLD})", fontsize=9)
    axes[1].axis("off")

    # Panel 3: annotated
    ann_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
    axes[2].imshow(ann_rgb)
    n_fire = sum(1 for d in out.detections if d.decision == "FIRE")
    axes[2].set_title(
        f"Detection Result\n{n_fire} FIRE / {len(out.detections)-n_fire} SUPPRESS",
        fontsize=9
    )
    axes[2].axis("off")

    plt.tight_layout()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


# ---------------------------------------------------------------------------
# SAVE INDIVIDUAL OUTPUTS
# ---------------------------------------------------------------------------

def save_pipeline_outputs(out: PipelineOutput) -> dict:
    """
    Save annotated image, ExG mask, and 3-panel figure for one pipeline result.

    Returns dict of saved paths.
    """
    base = os.path.splitext(out.image_name)[0]
    paths = {}

    # Annotated image
    ann = annotate_image(out)
    ann_path = os.path.join(cfg.ANNOTATED_DIR, f"{base}_annotated.png")
    os.makedirs(cfg.ANNOTATED_DIR, exist_ok=True)
    cv2.imwrite(ann_path, ann)
    paths["annotated"] = ann_path

    # ExG heatmap
    hm = exg_heatmap(out.exg_map)
    hm_path = os.path.join(cfg.MASK_DIR, f"{base}_exg.png")
    os.makedirs(cfg.MASK_DIR, exist_ok=True)
    cv2.imwrite(hm_path, hm)
    paths["exg_heatmap"] = hm_path

    # Clean mask
    mask_path = os.path.join(cfg.MASK_DIR, f"{base}_mask.png")
    cv2.imwrite(mask_path, out.clean_mask)
    paths["clean_mask"] = mask_path

    # 3-panel figure
    fig_path = os.path.join(cfg.CONTOUR_DIR, f"{base}_pipeline.png")
    os.makedirs(cfg.CONTOUR_DIR, exist_ok=True)
    save_detection_figure(out, fig_path)
    paths["figure"] = fig_path

    return paths


# ---------------------------------------------------------------------------
# ANALYTICS PLOTS  (batch-level)
# ---------------------------------------------------------------------------

def plot_volume_comparison(targeted_ml: float, blanket_ml: float,
                           save_path: str) -> None:
    """
    Graph 1 - Theoretical targeted volume vs blanket-spray baseline.

    [SIMULATION ONLY - values are calculated from assumed parameters]
    """
    fig, ax = plt.subplots(figsize=(7, 5))
    labels = ["Targeted\n(precision)", "Blanket\n(baseline)"]
    values = [targeted_ml, blanket_ml]
    colors = ["#27ae60", "#e74c3c"]

    bars = ax.bar(labels, values, color=colors, width=0.5, edgecolor="black")
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.05 * max(values),
                f"{val:.2f} mL", ha="center", va="bottom", fontweight="bold")

    saving = 100 * (1 - targeted_ml / blanket_ml) if blanket_ml > 0 else 0
    ax.set_title(
        f"Theoretical Volume Comparison [SIMULATION ONLY]\n"
        f"Theoretical reduction: {saving:.1f}%",
        fontsize=11
    )
    ax.set_ylabel("Volume (mL)")
    ax.set_xlabel("Spray Strategy")
    ax.set_ylim(0, blanket_ml * 1.25)
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    fig.text(0.5, 0.01,
             "SIMULATION ASSUMPTION - assumed flow rate, not physically measured",
             ha="center", fontsize=7, color="grey")
    plt.tight_layout()
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def plot_gate_comparison(color_fps: int, dual_fps: int,
                         color_tps: int, dual_tps: int,
                         save_path: str) -> None:
    """
    Graph 2 - Colour-only FP vs Dual-cue FP on the synthetic dataset.
    """
    fig, ax = plt.subplots(figsize=(7, 5))
    x = np.arange(2)
    width = 0.3
    bars_fp = ax.bar(x - width/2, [color_fps, dual_fps], width,
                     label="False Positives", color=["#e74c3c", "#c0392b"],
                     edgecolor="black")
    bars_tp = ax.bar(x + width/2, [color_tps, dual_tps], width,
                     label="True Positives",  color=["#27ae60", "#1e8449"],
                     edgecolor="black")

    for bar in list(bars_fp) + list(bars_tp):
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, h + 0.3,
                str(int(h)), ha="center", va="bottom", fontsize=9)

    ax.set_title("Gate Comparison: Colour-Only vs Dual-Cue [SIMULATION ONLY]",
                 fontsize=10)
    ax.set_ylabel("Event Count")
    ax.set_xticks(x)
    ax.set_xticklabels(["Colour-Only Gate", "Dual-Cue Gate"])
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    fig.text(0.5, 0.01, "Results on synthetic dataset - not field validated",
             ha="center", fontsize=7, color="grey")
    plt.tight_layout()
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def plot_dose_distribution(burst_values: list, save_path: str) -> None:
    """Graph 3 - Distribution of burst durations for FIRE events."""
    fig, ax = plt.subplots(figsize=(7, 5))
    if burst_values:
        ax.hist(burst_values, bins=15, color="#2980b9", edgecolor="black", alpha=0.85)
    ax.axvline(cfg.T_MIN_MS, color="red",   linestyle="--", label=f"T_min={cfg.T_MIN_MS} ms")
    ax.axvline(cfg.T_MAX_MS, color="green", linestyle="--", label=f"T_max={cfg.T_MAX_MS} ms")
    ax.set_title("Burst Duration Distribution [SIMULATION ONLY]", fontsize=11)
    ax.set_xlabel("Burst Duration (ms)")
    ax.set_ylabel("Count")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    fig.text(0.5, 0.01, "SIMULATION ASSUMPTION - values depend on synthetic target sizes",
             ha="center", fontsize=7, color="grey")
    plt.tight_layout()
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def plot_detection_outcomes(fire: int, suppress: int, no_candidate: int,
                            save_path: str) -> None:
    """Graph 4 - Detection outcome count bar chart."""
    fig, ax = plt.subplots(figsize=(7, 5))
    labels = ["FIRE", "SUPPRESS", "NO CANDIDATE"]
    values = [fire, suppress, no_candidate]
    colors = ["#27ae60", "#e74c3c", "#95a5a6"]

    bars = ax.bar(labels, values, color=colors, edgecolor="black", width=0.5)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2,
                bar.get_height() + 0.3,
                str(val), ha="center", va="bottom", fontweight="bold")

    ax.set_title("Detection Outcome Counts [SIMULATION ONLY]", fontsize=11)
    ax.set_ylabel("Number of Events")
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    fig.text(0.5, 0.01, "Synthetic dataset - not field validated",
             ha="center", fontsize=7, color="grey")
    plt.tight_layout()
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def plot_coordinate_visualization(df, save_path: str) -> None:
    """
    Graph 5 - Scatter plot of pixel coords vs computed nozzle bed coords.
    """
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.suptitle("Coordinate Transformation Simulation [SIMULATION ONLY]",
                 fontsize=11, fontweight="bold")

    # Left: pixel space
    ax = axes[0]
    ax.scatter(df["pixel_x"], df["pixel_y"],
               c="blue", s=100, zorder=5, label="Pixel centroid")
    ax.set_xlim(0, cfg.IMAGE_WIDTH)
    ax.set_ylim(cfg.IMAGE_HEIGHT, 0)
    ax.set_xlabel("Pixel X")
    ax.set_ylabel("Pixel Y")
    ax.set_title("Image Pixel Space")
    ax.legend()
    ax.grid(linestyle="--", alpha=0.4)

    # Right: bed space with nozzle offset
    ax = axes[1]
    ax.scatter(df["bed_x_mm"], df["bed_y_mm"],
               c="green", s=100, marker="s", label="Bed coordinate")
    ax.scatter(df["nozzle_x_mm"], df["nozzle_y_mm"],
               c="red", s=100, marker="^", label="Nozzle target")
    for _, row in df.iterrows():
        ax.annotate("", xy=(row["nozzle_x_mm"], row["nozzle_y_mm"]),
                    xytext=(row["bed_x_mm"], row["bed_y_mm"]),
                    arrowprops=dict(arrowstyle="->", color="grey"))
    ax.set_xlabel("X (mm)")
    ax.set_ylabel("Y (mm)")
    ax.set_xlim(-20, cfg.BED_WIDTH_MM + 80)
    ax.set_ylim(-20, cfg.BED_HEIGHT_MM + 20)
    ax.set_title(f"Test-Bed Space\n(Nozzle offset: Dx={cfg.NOZZLE_OFFSET_X_MM} mm)")
    ax.legend()
    ax.grid(linestyle="--", alpha=0.4)

    fig.text(0.5, 0.01,
             "SIMULATION ASSUMPTION - pixel-to-mm scale is placeholder; no physical calibration",
             ha="center", fontsize=7, color="grey")
    plt.tight_layout()
    plt.savefig(save_path, dpi=120, bbox_inches="tight")
    plt.close(fig)
