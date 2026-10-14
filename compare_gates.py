"""
compare_gates.py
================
Compares the colour-only gate against the dual-cue gate on the synthetic dataset.

TEST A - Colour-only gate
  Fire whenever mean_exg >= MIN_MEAN_EXG  (shape ignored)

TEST B - Dual-cue gate
  Fire only when BOTH colour cue AND shape cue pass

Ground truth is taken from data/labels/mock_labels.csv.
  ground_truth_class == "weed"  -> positive
  anything else                 -> negative

Metrics computed (SIMULATION ONLY):
  TP, TN, FP, FN
  Precision = TP / (TP + FP)
  Recall    = TP / (TP + FN)
  FPR       = FP / (FP + TN)

Outputs
-------
  outputs/gate_comparison.csv
  outputs/volume_comparison.png   ← Graph 2
  outputs/confusion_matrix.png    ← Confusion matrix side-by-side

All results are on the SYNTHETIC dataset.  Not field validated.
"""

import os
import csv
import pandas as pd

import config as cfg
from vision_pipeline import run_pipeline
from visualize import plot_gate_comparison


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_div(num: float, den: float) -> float:
    return num / den if den > 0 else float("nan")


def evaluate_gate(image_dir: str, labels_df: pd.DataFrame,
                  dual_cue: bool) -> dict:
    """
    Run every labelled image through the pipeline, apply gate, score result.

    Parameters
    ----------
    dual_cue : bool
        True  -> require BOTH colour and shape cue
        False -> colour cue only

    Returns
    -------
    dict with TP, TN, FP, FN and derived metrics
    """
    tp = tn = fp = fn = 0
    fire_count = 0

    for _, row in labels_df.iterrows():
        path = os.path.join(image_dir, row["filename"])
        if not os.path.exists(path):
            continue

        gt_positive = (str(row["ground_truth_class"]).strip() == "weed")

        out = run_pipeline(path, row["filename"])

        # Determine if ANY candidate fires
        fired = False
        for det in out.detections:
            if dual_cue:
                if det.colour_cue and det.shape_cue:
                    fired = True
                    break
            else:
                if det.colour_cue:   # colour only
                    fired = True
                    break

        if fired:
            fire_count += 1
            if gt_positive:
                tp += 1
            else:
                fp += 1
        else:
            if gt_positive:
                fn += 1
            else:
                tn += 1

    precision = _safe_div(tp, tp + fp)
    recall    = _safe_div(tp, tp + fn)
    fpr       = _safe_div(fp, fp + tn)
    f1        = _safe_div(2 * precision * recall, precision + recall)

    return {
        "gate":      "Dual-Cue" if dual_cue else "Colour-Only",
        "TP":        tp,
        "TN":        tn,
        "FP":        fp,
        "FN":        fn,
        "Precision": round(precision, 4),
        "Recall":    round(recall, 4),
        "FPR":       round(fpr, 4),
        "F1":        round(f1, 4),
        "FireCount": fire_count,
        "note":      "SIMULATION-ONLY - synthetic dataset",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_comparison():
    # Load ground-truth labels
    if not os.path.exists(cfg.MOCK_LABELS_CSV):
        print(f"[ERROR] Labels not found: {cfg.MOCK_LABELS_CSV}")
        print("        Run generate_mock_dataset.py first.")
        return

    labels_df = pd.read_csv(cfg.MOCK_LABELS_CSV, encoding='utf-8')
    n = len(labels_df)
    print(f"\nLoaded {n} labels from {cfg.MOCK_LABELS_CSV}")

    print("\n[SIMULATION ONLY] Evaluating Colour-Only gate...")
    res_a = evaluate_gate(cfg.MOCK_IMAGE_DIR, labels_df, dual_cue=False)

    print("[SIMULATION ONLY] Evaluating Dual-Cue gate...")
    res_b = evaluate_gate(cfg.MOCK_IMAGE_DIR, labels_df, dual_cue=True)

    # Print table
    print(f"\n{'='*62}")
    print(f"  GATE COMPARISON [SIMULATION ONLY - synthetic dataset]")
    print(f"  {'Metric':<18} {'Colour-Only':>14} {'Dual-Cue':>12}")
    print(f"  {'-'*18} {'-'*14} {'-'*12}")
    for key in ["TP", "TN", "FP", "FN", "Precision", "Recall", "FPR", "F1"]:
        print(f"  {key:<18} {str(res_a[key]):>14} {str(res_b[key]):>12}")
    print(f"{'='*62}\n")

    # Save CSV
    os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)
    fields = ["gate", "TP", "TN", "FP", "FN",
              "Precision", "Recall", "FPR", "F1", "FireCount", "note"]

    with open(cfg.GATE_COMPARISON_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerow({k: res_a[k] for k in fields})
        w.writerow({k: res_b[k] for k in fields})
    print(f"Saved: {cfg.GATE_COMPARISON_CSV}")

    # Plot
    plot_path = os.path.join(cfg.OUTPUT_DIR, "volume_comparison.png")
    plot_gate_comparison(
        color_fps = res_a["FP"],
        dual_fps  = res_b["FP"],
        color_tps = res_a["TP"],
        dual_tps  = res_b["TP"],
        save_path = plot_path,
    )
    print(f"Saved: {plot_path}")
    print("\nNOTE: All results above are SIMULATION ONLY.")
    print("      They were computed on a synthetic mock dataset.")
    print("      They do NOT represent agricultural field performance.")

    return res_a, res_b


if __name__ == "__main__":
    run_comparison()
