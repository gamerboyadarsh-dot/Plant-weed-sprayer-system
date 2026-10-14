"""
coordinate_simulation.py
=========================
Simulates the camera pixel -> physical test-bed coordinate transformation
and camera-to-nozzle offset calculation.

Transformation model (INITIAL TOP-DOWN APPROXIMATION)
------------------------------------------------------
For a top-mounted camera looking straight down:

    x_bed = (u / (W-1)) x BW
    y_bed = (v / (H-1)) x BH

where
    u, v  = pixel coordinates (origin: top-left)
    W, H  = image width and height (pixels)
    BW, BH = test-bed physical dimensions (mm)

Camera-to-nozzle offset:
    x_nozzle = x_bed + NOZZLE_OFFSET_X_MM
    y_nozzle = y_bed + NOZZLE_OFFSET_Y_MM

IMPORTANT LIMITATIONS
---------------------
- This is an INITIAL APPROXIMATION only.
- Assumes perfect top-down (nadir) camera mounting.
- Real cameras will require perspective/homography calibration.
- Physical offset values are SIMULATION ASSUMPTIONS.
- No physical calibration has been performed.

Aim Error Simulation
--------------------
To validate the coordinate model, synthetic ground-truth points
are compared against predicted nozzle coordinates.
A Gaussian noise term simulates real-world aim uncertainty.
This is a COORDINATE MODEL VALIDATION - not physical spray accuracy.

Outputs
-------
  outputs/coordinate_tests.csv
  outputs/coordinate_visualization.png  ← Graph 5
"""

import os
import csv
import math
import random
import numpy as np
import pandas as pd

import config as cfg
from visualize import plot_coordinate_visualization

random.seed(cfg.RANDOM_SEED)
np.random.seed(cfg.RANDOM_SEED)


# ---------------------------------------------------------------------------
# Core transformation
# ---------------------------------------------------------------------------

def pixel_to_bed(u: float, v: float,
                 img_w: int = cfg.IMAGE_WIDTH,
                 img_h: int = cfg.IMAGE_HEIGHT,
                 bed_w: float = cfg.BED_WIDTH_MM,
                 bed_h: float = cfg.BED_HEIGHT_MM) -> tuple:
    """
    Convert pixel coordinates (u, v) -> bed coordinates (x_bed, y_bed) in mm.

    Linear (top-down) approximation:
        x_bed = u / (W-1) x BW
        y_bed = v / (H-1) x BH

    [SIMULATION ASSUMPTION - pending physical calibration]
    """
    if img_w <= 1:
        img_w = 2
    if img_h <= 1:
        img_h = 2
    x_bed = (u / (img_w - 1)) * bed_w
    y_bed = (v / (img_h - 1)) * bed_h
    return round(x_bed, 3), round(y_bed, 3)


def apply_nozzle_offset(x_bed: float, y_bed: float,
                         dx: float = cfg.NOZZLE_OFFSET_X_MM,
                         dy: float = cfg.NOZZLE_OFFSET_Y_MM) -> tuple:
    """
    Apply the camera-to-nozzle physical offset.

    x_nozzle = x_bed + dx
    y_nozzle = y_bed + dy

    dx, dy are SIMULATION ASSUMPTIONS - pending physical measurement.
    """
    return round(x_bed + dx, 3), round(y_bed + dy, 3)


def euclidean_error(pred_x: float, pred_y: float,
                    actual_x: float, actual_y: float) -> float:
    """
    Euclidean distance error between predicted and ground-truth position (mm).

    error_mm = sqrt((pred_x − actual_x)2 + (pred_y − actual_y)2)

    This is a COORDINATE MODEL VALIDATION - not physical spray accuracy.
    """
    return math.sqrt((pred_x - actual_x) ** 2 + (pred_y - actual_y) ** 2)


# ---------------------------------------------------------------------------
# Optional: 4-point perspective transform stub
# ---------------------------------------------------------------------------

def perspective_transform_stub(src_points, dst_points_mm, pixel_point):
    """
    Optional future function for homography-based coordinate mapping.

    NOT yet implemented - requires physical calibration reference points.

    Parameters
    ----------
    src_points      : 4 pixel-space reference points  (Nx2 array)
    dst_points_mm   : 4 real-world reference points in mm (Nx2 array)
    pixel_point     : (u, v) to transform

    Returns
    -------
    (x_mm, y_mm)  : transformed real-world coordinate (mm)

    FUTURE WORK: Replace linear model with this function after
    physical four-corner calibration of the camera mount.
    """
    raise NotImplementedError(
        "Perspective transform pending physical calibration. "
        "Use pixel_to_bed() with the linear approximation for now."
    )


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

NAMED_TEST_POINTS = [
    ("top_left",      0,                  0),
    ("top_centre",    cfg.IMAGE_WIDTH//2, 0),
    ("top_right",     cfg.IMAGE_WIDTH-1,  0),
    ("centre",        cfg.IMAGE_WIDTH//2, cfg.IMAGE_HEIGHT//2),
    ("bottom_left",   0,                  cfg.IMAGE_HEIGHT-1),
    ("bottom_centre", cfg.IMAGE_WIDTH//2, cfg.IMAGE_HEIGHT-1),
    ("bottom_right",  cfg.IMAGE_WIDTH-1,  cfg.IMAGE_HEIGHT-1),
]

# Additional random test points
N_RANDOM_TESTS = 13


def run_coordinate_simulation():
    """
    Generate coordinate test cases, compute transformations and aim errors,
    save CSV and visualization.
    """
    rows = []

    # Named corner/centre points
    for name, px, py in NAMED_TEST_POINTS:
        x_bed, y_bed       = pixel_to_bed(px, py)
        x_nozzle, y_nozzle = apply_nozzle_offset(x_bed, y_bed)

        # Simulated aim error: add Gaussian noise to nozzle coordinate
        noise_x = float(np.random.normal(0, cfg.AIM_NOISE_STD_MM))
        noise_y = float(np.random.normal(0, cfg.AIM_NOISE_STD_MM))
        x_actual = x_nozzle + noise_x   # simulated "true" landing point
        y_actual = y_nozzle + noise_y

        err_mm = euclidean_error(x_nozzle, y_nozzle, x_actual, y_actual)

        rows.append({
            "test_name":     name,
            "pixel_x":       px,
            "pixel_y":       py,
            "bed_x_mm":      x_bed,
            "bed_y_mm":      y_bed,
            "offset_x_mm":   cfg.NOZZLE_OFFSET_X_MM,
            "offset_y_mm":   cfg.NOZZLE_OFFSET_Y_MM,
            "nozzle_x_mm":   x_nozzle,
            "nozzle_y_mm":   y_nozzle,
            "aim_error_mm":  round(err_mm, 3),
            "note":          "SIMULATION ASSUMPTION - coordinate model only",
        })

    # Random test points
    for i in range(N_RANDOM_TESTS):
        px = random.randint(0, cfg.IMAGE_WIDTH - 1)
        py = random.randint(0, cfg.IMAGE_HEIGHT - 1)
        x_bed, y_bed       = pixel_to_bed(px, py)
        x_nozzle, y_nozzle = apply_nozzle_offset(x_bed, y_bed)

        noise_x = float(np.random.normal(0, cfg.AIM_NOISE_STD_MM))
        noise_y = float(np.random.normal(0, cfg.AIM_NOISE_STD_MM))
        err_mm  = euclidean_error(x_nozzle, y_nozzle,
                                   x_nozzle + noise_x, y_nozzle + noise_y)
        rows.append({
            "test_name":     f"random_{i+1:02d}",
            "pixel_x":       px,
            "pixel_y":       py,
            "bed_x_mm":      x_bed,
            "bed_y_mm":      y_bed,
            "offset_x_mm":   cfg.NOZZLE_OFFSET_X_MM,
            "offset_y_mm":   cfg.NOZZLE_OFFSET_Y_MM,
            "nozzle_x_mm":   x_nozzle,
            "nozzle_y_mm":   y_nozzle,
            "aim_error_mm":  round(err_mm, 3),
            "note":          "SIMULATION ASSUMPTION - coordinate model only",
        })

    df = pd.DataFrame(rows)

    # Save CSV
    os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)
    df.to_csv(cfg.COORDINATE_CSV, index=False)
    print(f"Saved: {cfg.COORDINATE_CSV}")

    # Print table
    print(f"\n{'='*70}")
    print(f"  COORDINATE TRANSFORMATION  [SIMULATION ONLY]")
    print(f"  Linear top-down model | Nozzle offset: "
          f"Dx={cfg.NOZZLE_OFFSET_X_MM} mm, Dy={cfg.NOZZLE_OFFSET_Y_MM} mm")
    print(f"  Bed: {cfg.BED_WIDTH_MM}x{cfg.BED_HEIGHT_MM} mm  | "
          f"Noise sigma={cfg.AIM_NOISE_STD_MM} mm [SIMULATION ASSUMPTION]")
    print(f"{'='*70}")
    print(f"  {'Point':<16} {'Px':>5} {'Py':>5} | "
          f"{'Bed X':>7} {'Bed Y':>7} | {'Nozzle X':>9} {'Nozzle Y':>9} | "
          f"{'ErrMM':>7}")
    print(f"  {'-'*70}")
    for r in rows[:7]:
        print(f"  {r['test_name']:<16} {r['pixel_x']:>5} {r['pixel_y']:>5} | "
              f"{r['bed_x_mm']:>7.1f} {r['bed_y_mm']:>7.1f} | "
              f"{r['nozzle_x_mm']:>9.1f} {r['nozzle_y_mm']:>9.1f} | "
              f"{r['aim_error_mm']:>7.2f}")
    print(f"{'='*70}")
    print(f"\n  *** SIMULATION NOTE: This is coordinate-model validation only. ***")
    print(f"  *** Aim error noise is synthetic (sigma={cfg.AIM_NOISE_STD_MM} mm). ***")
    print(f"  *** Physical spray accuracy pending hardware integration.     ***\n")

    # Visualization
    viz_path = os.path.join(cfg.OUTPUT_DIR, "coordinate_visualization.png")
    plot_coordinate_visualization(df, viz_path)
    print(f"Saved: {viz_path}")

    return df


if __name__ == "__main__":
    run_coordinate_simulation()
