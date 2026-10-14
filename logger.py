"""
logger.py
=========
Structured CSV event logger for the weed-sprayer simulation.

Every processed image/candidate appends one row to events.csv.
The file is created with a header if it does not already exist.

All values are simulation outputs - not physical measurements.
"""

import csv
import os
from datetime import datetime
from typing import Optional

import config as cfg

EVENT_COLUMNS = [
    "timestamp",
    "image_name",
    "candidate_id",
    "target_detected",
    "colour_cue",
    "shape_cue",
    "decision",
    "area_px",
    "centroid_x",
    "centroid_y",
    "bounding_box_x",
    "bounding_box_y",
    "bounding_box_w",
    "bounding_box_h",
    "aspect_ratio",
    "solidity",
    "extent",
    "circularity",
    "mean_exg",
    "burst_ms",
    "flow_rate_ml_s",
    "estimated_volume_ml",
    "note",
]


def _ensure_header(path: str) -> None:
    """Write CSV header if the file does not exist yet."""
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=EVENT_COLUMNS)
            writer.writeheader()


def log_event(
    image_name: str,
    candidate_id: int,
    target_detected: bool,
    colour_cue: bool,
    shape_cue: bool,
    decision: str,
    area_px: float,
    centroid_x: float,
    centroid_y: float,
    bb_x: int,
    bb_y: int,
    bb_w: int,
    bb_h: int,
    aspect_ratio: float,
    solidity: float,
    extent: float,
    circularity: float,
    mean_exg: float,
    burst_ms: float,
    estimated_volume_ml: float,
    csv_path: str = cfg.EVENTS_CSV,
) -> None:
    """
    Append one event row to the events CSV.

    Parameters
    ----------
    decision           : "FIRE" or "SUPPRESS"
    burst_ms           : 0 for SUPPRESS events
    estimated_volume_ml: 0 for SUPPRESS events
    """
    _ensure_header(csv_path)

    row = {
        "timestamp":           datetime.now().isoformat(),
        "image_name":          image_name,
        "candidate_id":        candidate_id,
        "target_detected":     int(target_detected),
        "colour_cue":          int(colour_cue),
        "shape_cue":           int(shape_cue),
        "decision":            decision,
        "area_px":             round(area_px, 2),
        "centroid_x":          round(centroid_x, 2),
        "centroid_y":          round(centroid_y, 2),
        "bounding_box_x":      bb_x,
        "bounding_box_y":      bb_y,
        "bounding_box_w":      bb_w,
        "bounding_box_h":      bb_h,
        "aspect_ratio":        round(aspect_ratio, 4),
        "solidity":            round(solidity, 4),
        "extent":              round(extent, 4),
        "circularity":         round(circularity, 4),
        "mean_exg":            round(mean_exg, 4),
        "burst_ms":            round(burst_ms, 2),
        "flow_rate_ml_s":      cfg.FLOW_RATE_ML_S,
        "estimated_volume_ml": round(estimated_volume_ml, 4),
        "note":                "SIMULATION-ONLY - not a physical measurement",
    }

    with open(csv_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=EVENT_COLUMNS)
        writer.writerow(row)


def log_no_detection(image_name: str, csv_path: str = cfg.EVENTS_CSV) -> None:
    """
    Log a row for an image that produced zero candidates.
    """
    _ensure_header(csv_path)

    row = {col: "" for col in EVENT_COLUMNS}
    row["timestamp"]      = datetime.now().isoformat()
    row["image_name"]     = image_name
    row["candidate_id"]   = -1
    row["target_detected"]= 0
    row["colour_cue"]     = 0
    row["shape_cue"]      = 0
    row["decision"]       = "NO_CANDIDATE"
    row["burst_ms"]       = 0
    row["flow_rate_ml_s"] = cfg.FLOW_RATE_ML_S
    row["estimated_volume_ml"] = 0
    row["note"]           = "SIMULATION-ONLY - no candidate detected"

    with open(csv_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=EVENT_COLUMNS)
        writer.writerow(row)
