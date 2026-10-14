"""
create_report_assets.py
=======================
Convenience script that re-generates ALL output graphs and the Review-II
results table from existing CSV files.

Run this after run_batch.py, compare_gates.py, dose_and_baseline.py,
and coordinate_simulation.py have all been executed.

Usage
-----
    python create_report_assets.py
"""

import os
import pandas as pd

import config as cfg
from visualize import (
    plot_volume_comparison,
    plot_gate_comparison,
    plot_dose_distribution,
    plot_detection_outcomes,
    plot_coordinate_visualization,
)


def generate_results_table(metrics: dict, gate_a: dict, gate_b: dict) -> str:
    """
    Build a markdown Review-II results table.

    NOTE: All values are SIMULATION ONLY.
    """
    saving = metrics.get("volume_reduction_percent", float("nan"))
    prec_a = gate_a.get("Precision", float("nan"))
    prec_b = gate_b.get("Precision", float("nan"))
    rec_b  = gate_b.get("Recall", float("nan"))
    fpr_a  = gate_a.get("FPR", float("nan"))
    fpr_b  = gate_b.get("FPR", float("nan"))

    lines = [
        "## REVIEW-II SIMULATION RESULTS TABLE\n",
        "> WARNING: SIMULATION ONLY -- Synthetic dataset. Not field validated.\n",
        "| Metric | Result | Status |",
        "|--------|--------|--------|",
        f"| Images processed | {metrics.get('total_images','--')} | Simulation |",
        f"| FIRE events | {metrics.get('fire_events','--')} | Simulation |",
        f"| SUPPRESS events | {metrics.get('suppressed_events','--')} | Simulation |",
        f"| Colour-only Precision | {prec_a:.3f} | Simulation |",
        f"| Dual-cue Precision | {prec_b:.3f} | Simulation |",
        f"| Dual-cue Recall | {rec_b:.3f} | Simulation |",
        f"| Colour-only FPR | {fpr_a:.3f} | Simulation |",
        f"| Dual-cue FPR | {fpr_b:.3f} | Simulation |",
        f"| Targeted volume [sim] | {metrics.get('targeted_volume_ml','--'):.3f} mL | Simulation |",
        f"| Blanket baseline [sim] | {metrics.get('blanket_volume_ml','--'):.3f} mL | Simulation |",
        f"| Theoretical reduction | {saving:.1f}% | Simulation |",
        "",
        f"_Assumed flow rate: {cfg.FLOW_RATE_ML_S} mL/s [SIMULATION ASSUMPTION]_",
        "_Physical pump calibration: PENDING_",
    ]
    return "\n".join(lines)


def main():
    os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)

    # --- Load CSVs ---
    def _load(path, label):
        if not os.path.exists(path):
            print(f"[SKIP] {label} not found: {path}")
            return None
        return pd.read_csv(path)

    events_df   = _load(cfg.EVENTS_CSV,         "events CSV")
    metrics_df  = _load(cfg.METRICS_CSV,        "metrics CSV")
    gate_df     = _load(cfg.GATE_COMPARISON_CSV,"gate comparison CSV")
    coord_df    = _load(cfg.COORDINATE_CSV,     "coordinate CSV")

    # --- Dose distribution ---
    if events_df is not None:
        burst_vals = events_df.loc[
            events_df["decision"] == "FIRE", "burst_ms"
        ].dropna().tolist()
        plot_dose_distribution(
            burst_vals,
            os.path.join(cfg.OUTPUT_DIR, "dose_distribution.png")
        )
        fire  = int((events_df["decision"] == "FIRE").sum())
        sup   = int((events_df["decision"] == "SUPPRESS").sum())
        nocnd = int((events_df["decision"] == "NO_CANDIDATE").sum())
        plot_detection_outcomes(
            fire, sup, nocnd,
            os.path.join(cfg.OUTPUT_DIR, "detection_examples.png")
        )
        print(f"Saved dose_distribution.png and detection_examples.png")

    # --- Volume comparison ---
    if metrics_df is not None and not metrics_df.empty:
        row = metrics_df.iloc[0]
        plot_volume_comparison(
            float(row["targeted_volume_ml"]),
            float(row["blanket_volume_ml"]),
            os.path.join(cfg.OUTPUT_DIR, "volume_comparison.png")
        )
        print(f"Saved volume_comparison.png")

    # --- Gate comparison ---
    if gate_df is not None and len(gate_df) >= 2:
        res_a = gate_df[gate_df["gate"] == "Colour-Only"].iloc[0].to_dict()
        res_b = gate_df[gate_df["gate"] == "Dual-Cue"].iloc[0].to_dict()
        plot_gate_comparison(
            int(res_a["FP"]), int(res_b["FP"]),
            int(res_a["TP"]), int(res_b["TP"]),
            os.path.join(cfg.OUTPUT_DIR, "confusion_matrix.png")
        )
        print(f"Saved confusion_matrix.png")
    else:
        res_a = res_b = {}

    # --- Coordinate visualization ---
    if coord_df is not None:
        plot_coordinate_visualization(
            coord_df,
            os.path.join(cfg.OUTPUT_DIR, "coordinate_visualization.png")
        )
        print(f"Saved coordinate_visualization.png")

    # --- Results table ---
    if metrics_df is not None and not metrics_df.empty:
        metrics = metrics_df.iloc[0].to_dict()
        table_md = generate_results_table(metrics, res_a, res_b)
        table_path = os.path.join(cfg.OUTPUT_DIR, "review_ii_results_table.md")
        with open(table_path, "w", encoding="utf-8") as f:
            f.write(table_md)
        print(f"Saved: {table_path}")
        print("\n" + table_md)

    print("\n[DONE] All report assets generated.")
    print("NOTE: All results are SIMULATION ONLY - not field validated.\n")


if __name__ == "__main__":
    main()
