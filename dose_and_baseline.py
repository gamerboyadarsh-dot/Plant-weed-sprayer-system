"""
dose_and_baseline.py
====================
Calculates theoretical spray volumes and compares targeted dosing
against the blanket-spray software baseline.

IMPORTANT: All values here are SIMULATION ASSUMPTIONS.
  - Flow rate is a placeholder (physical pump calibration pending)
  - Blanket baseline uses a virtual time window per frame (software only)
  - Results are NOT agricultural field measurements

Outputs
-------
  outputs/metrics.csv
  outputs/dose_distribution.png   ← Graph 3
  outputs/detection_examples.png  ← Graph 4
"""

import os
import csv
import pandas as pd
import numpy as np

import config as cfg
from visualize import plot_volume_comparison, plot_dose_distribution, plot_detection_outcomes


# ---------------------------------------------------------------------------
# Volume calculations
# ---------------------------------------------------------------------------

def compute_targeted_volume(events_df: pd.DataFrame) -> float:
    """
    Sum all estimated spray volumes from FIRE events.

    V_targeted = Σ ( Q x burst_ms / 1000 )

    Q is a SIMULATION ASSUMPTION - physical pump calibration is pending.
    """
    fire_rows = events_df[events_df["decision"] == "FIRE"]
    if fire_rows.empty:
        return 0.0
    # Re-compute from burst_ms to ensure consistency with current config
    total_burst_s = fire_rows["burst_ms"].sum() / 1000.0
    return cfg.FLOW_RATE_ML_S * total_burst_s


def compute_blanket_volume(n_images: int) -> float:
    """
    Theoretical blanket-spray baseline volume.

    Formula:
        T_blanket = n_images x VIRTUAL_TIME_PER_IMAGE_S
        V_blanket = Q x T_blanket

    This is a SOFTWARE BASELINE, not a physical measurement.
    In future hardware integration, replace with:
        T_pass = travel_distance / travel_speed

    [SIMULATION ASSUMPTION - pending physical hardware integration]
    """
    t_blanket = n_images * cfg.VIRTUAL_TIME_PER_IMAGE_S
    return cfg.FLOW_RATE_ML_S * t_blanket


def compute_saving(targeted_ml: float, blanket_ml: float) -> float:
    """
    Theoretical volume saving percentage.

    Saving_% = 100 x (1 − V_targeted / V_blanket)

    NOTE: This is a THEORETICAL reduction in the software simulation.
          It does NOT represent actual herbicide savings in the field.
    """
    if blanket_ml <= 0:
        return float("nan")
    return 100.0 * (1.0 - targeted_ml / blanket_ml)


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def run_dose_analysis():
    if not os.path.exists(cfg.EVENTS_CSV):
        print(f"[ERROR] Events log not found: {cfg.EVENTS_CSV}")
        print("        Run run_batch.py first.")
        return

    events_df = pd.read_csv(cfg.EVENTS_CSV)

    # Sanitise
    events_df["burst_ms"] = pd.to_numeric(events_df["burst_ms"], errors="coerce").fillna(0)
    events_df["estimated_volume_ml"] = pd.to_numeric(
        events_df["estimated_volume_ml"], errors="coerce").fillna(0)

    total_images    = events_df["image_name"].nunique()
    fire_events     = int((events_df["decision"] == "FIRE").sum())
    suppress_events = int((events_df["decision"] == "SUPPRESS").sum())
    no_cand_events  = int((events_df["decision"] == "NO_CANDIDATE").sum())
    total_burst_ms  = float(events_df["burst_ms"].sum())

    targeted_ml = compute_targeted_volume(events_df)
    blanket_ml  = compute_blanket_volume(total_images)
    saving_pct  = compute_saving(targeted_ml, blanket_ml)
    abs_diff_ml = blanket_ml - targeted_ml

    burst_vals  = events_df.loc[
        events_df["decision"] == "FIRE", "burst_ms"
    ].tolist()

    # Print summary
    print(f"\n{'='*62}")
    print(f"  DOSE & BASELINE ANALYSIS  [SIMULATION ONLY]")
    print(f"{'='*62}")
    print(f"  Total images processed   : {total_images}")
    print(f"  FIRE events              : {fire_events}")
    print(f"  SUPPRESS events          : {suppress_events}")
    print(f"  No-candidate events      : {no_cand_events}")
    print(f"  Total burst duration     : {total_burst_ms:.1f} ms")
    print(f"  Targeted volume [sim]    : {targeted_ml:.3f} mL")
    print(f"  Blanket baseline [sim]   : {blanket_ml:.3f} mL")
    print(f"  Theoretical reduction    : {saving_pct:.1f}%")
    print(f"  Absolute difference      : {abs_diff_ml:.3f} mL")
    print(f"  Flow rate [assumed]      : {cfg.FLOW_RATE_ML_S} mL/s")
    print(f"  Virtual time/frame [sim] : {cfg.VIRTUAL_TIME_PER_IMAGE_S} s")
    print(f"{'='*62}")
    print(f"\n  *** SIMULATION ASSUMPTION: flow rate is a placeholder. ***")
    print(f"  *** Physical pump calibration is a future task.         ***\n")

    # Save metrics CSV
    os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)
    metrics = {
        "total_images":             total_images,
        "fire_events":              fire_events,
        "suppressed_events":        suppress_events,
        "no_candidate_events":      no_cand_events,
        "total_burst_ms":           round(total_burst_ms, 2),
        "targeted_volume_ml":       round(targeted_ml, 4),
        "blanket_volume_ml":        round(blanket_ml, 4),
        "volume_difference_ml":     round(abs_diff_ml, 4),
        "volume_reduction_percent": round(saving_pct, 2),
        "assumed_flow_rate_ml_s":   cfg.FLOW_RATE_ML_S,
        "virtual_time_per_image_s": cfg.VIRTUAL_TIME_PER_IMAGE_S,
        "note":                     "SIMULATION-ONLY - not a physical measurement",
    }
    with open(cfg.METRICS_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(metrics.keys()))
        w.writeheader()
        w.writerow(metrics)
    print(f"Saved: {cfg.METRICS_CSV}")

    # Generate graphs
    vol_path = os.path.join(cfg.OUTPUT_DIR, "volume_comparison.png")
    plot_volume_comparison(targeted_ml, blanket_ml, vol_path)
    print(f"Saved: {vol_path}")

    dose_path = os.path.join(cfg.OUTPUT_DIR, "dose_distribution.png")
    plot_dose_distribution(burst_vals, dose_path)
    print(f"Saved: {dose_path}")

    det_path = os.path.join(cfg.OUTPUT_DIR, "detection_examples.png")
    plot_detection_outcomes(fire_events, suppress_events, no_cand_events, det_path)
    print(f"Saved: {det_path}")

    return metrics


if __name__ == "__main__":
    run_dose_analysis()
