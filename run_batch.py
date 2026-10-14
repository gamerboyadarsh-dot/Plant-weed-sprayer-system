"""
run_batch.py
============
Batch-processes all images in data/mock_images/ through the vision pipeline.

For each image:
  - Runs the full pipeline (ExG -> mask -> contours -> dual-cue -> dosing)
  - Saves annotated images, masks, and figures to outputs/
  - Appends events to outputs/events.csv

Usage
-----
    python run_batch.py

All results are SIMULATION ONLY.
"""

import os
import glob
import time

import config as cfg
from vision_pipeline import run_pipeline
from visualize import save_pipeline_outputs
from logger import log_event, log_no_detection


SUPPORTED_EXTS = {".jpg", ".jpeg", ".png"}


def process_folder(image_dir: str = cfg.MOCK_IMAGE_DIR) -> dict:
    """
    Process every supported image in image_dir.

    Returns a summary dict.
    """
    # Gather image paths
    paths = sorted([
        p for p in glob.glob(os.path.join(image_dir, "*"))
        if os.path.splitext(p)[1].lower() in SUPPORTED_EXTS
    ])

    if not paths:
        print(f"[WARNING] No images found in: {image_dir}")
        return {"total": 0}

    # Clear old events CSV so each batch run starts fresh
    if os.path.exists(cfg.EVENTS_CSV):
        os.remove(cfg.EVENTS_CSV)

    total      = len(paths)
    fire_count = 0
    sup_count  = 0
    no_cand    = 0
    errors     = 0
    burst_vals = []
    t0         = time.time()

    print(f"\n{'='*60}")
    print(f"  BATCH PROCESSING -- {total} images  [SIMULATION ONLY]")
    print(f"{'='*60}")

    for i, path in enumerate(paths, 1):
        img_name = os.path.basename(path)
        out = run_pipeline(path, img_name)

        if out.error:
            print(f"  [{i:>3}/{total}] ERROR  {img_name}: {out.error}")
            errors += 1
            continue

        if not out.detections:
            log_no_detection(img_name)
            no_cand += 1
            print(f"  [{i:>3}/{total}] NO CANDIDATE  {img_name}")
            continue

        # Save visual outputs for every 10th image to avoid disk bloat
        if i % 10 == 1:
            save_pipeline_outputs(out)

        for det in out.detections:
            f = det.features
            log_event(
                image_name          = img_name,
                candidate_id        = f.contour_id,
                target_detected     = True,
                colour_cue          = det.colour_cue,
                shape_cue           = det.shape_cue,
                decision            = det.decision,
                area_px             = f.area,
                centroid_x          = f.cx,
                centroid_y          = f.cy,
                bb_x                = f.bb_x,
                bb_y                = f.bb_y,
                bb_w                = f.bb_w,
                bb_h                = f.bb_h,
                aspect_ratio        = f.aspect_ratio,
                solidity            = f.solidity,
                extent              = f.extent,
                circularity         = f.circularity,
                mean_exg            = f.mean_exg,
                burst_ms            = det.burst_ms,
                estimated_volume_ml = det.volume_ml,
            )
            if det.decision == "FIRE":
                fire_count += 1
                burst_vals.append(det.burst_ms)
            else:
                sup_count += 1

        decisions = [d.decision for d in out.detections]
        print(f"  [{i:>3}/{total}] {img_name}  -> {decisions}")

    elapsed = time.time() - t0

    summary = {
        "total":      total,
        "fire":       fire_count,
        "suppress":   sup_count,
        "no_cand":    no_cand,
        "errors":     errors,
        "burst_vals": burst_vals,
        "elapsed_s":  round(elapsed, 2),
    }

    print(f"\n{'='*60}")
    print(f"  BATCH COMPLETE  ({elapsed:.1f}s)  [SIMULATION ONLY]")
    print(f"  Images:     {total}")
    print(f"  FIRE:       {fire_count}")
    print(f"  SUPPRESS:   {sup_count}")
    print(f"  No candid:  {no_cand}")
    print(f"  Errors:     {errors}")
    print(f"  Events CSV: {cfg.EVENTS_CSV}")
    print(f"{'='*60}\n")

    return summary


if __name__ == "__main__":
    process_folder()
