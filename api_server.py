"""
api_server.py
=============
FastAPI backend providing REST APIs for the React + Vite Precision Weed Sprayer dashboard.

Endpoints:
- GET  /api/images     - Returns all 90 synthetic images with metadata
- POST /api/process    - Processes a selected or uploaded image and returns full CV pipeline results
- GET  /api/events     - Returns structured events log
- GET  /api/analytics  - Returns Review-II metrics, tables, and chart URLs
"""

import os
import io
import base64
import cv2
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

import config as cfg
import vision_pipeline as vp
from visualize import annotate_image

app = FastAPI(title="Precision Micro-Dosing Weed Sprayer API", version="1.0.0")

# Enable CORS for Vite dev server (port 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset folders
os.makedirs(cfg.MOCK_IMAGE_DIR, exist_ok=True)
os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)
app.mount("/static/mock_images", StaticFiles(directory=cfg.MOCK_IMAGE_DIR), name="mock_images")
app.mount("/static/outputs", StaticFiles(directory=cfg.OUTPUT_DIR), name="outputs")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _np_to_base64(img_bgr: np.ndarray, ext: str = ".png") -> str:
    """Encode OpenCV BGR or single channel image to base64 data URI."""
    success, buffer = cv2.imencode(ext, img_bgr)
    if not success:
        return ""
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"

# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class ProcessRequest(BaseModel):
    image_name: Optional[str] = "weed_0001.png"
    image_base64: Optional[str] = None
    exg_threshold: float = 0.05
    min_contour_area: float = 500
    max_contour_area: float = 80000
    min_circularity: float = 0.15
    min_solidity: float = 0.40
    t_min_ms: float = 80
    t_max_ms: float = 320
    a_ref: float = 12000
    flow_rate_ml_s: float = 2.0
    bed_width_mm: float = 500
    bed_height_mm: float = 400
    nozzle_offset_x_mm: float = 50
    nozzle_offset_y_mm: float = 0

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "project": "Precision Micro-Dosing Weed Sprayer",
        "review": "Review-II Proof-of-Concept",
        "images_count": len([f for f in os.listdir(cfg.MOCK_IMAGE_DIR) if f.endswith(".png")]) if os.path.exists(cfg.MOCK_IMAGE_DIR) else 0
    }

@app.get("/api/images")
def get_images():
    """Return all 90 synthetic images with ground truth metadata."""
    records = []
    labels_dict = {}
    
    if os.path.exists(cfg.MOCK_LABELS_CSV):
        try:
            df = pd.read_csv(cfg.MOCK_LABELS_CSV, encoding="utf-8")
        except Exception:
            df = pd.read_csv(cfg.MOCK_LABELS_CSV, encoding="cp1252", encoding_errors="replace")
        for _, row in df.iterrows():
            labels_dict[row["filename"]] = {
                "class": str(row.get("ground_truth_class", "unknown")),
                "target_present": bool(row.get("target_present", False)),
                "target_area": float(row.get("target_area", 0)),
                "center_x": float(row.get("target_center_x", 0)),
                "center_y": float(row.get("target_center_y", 0)),
                "scene_type": str(row.get("synthetic_scene_type", "")),
            }

    if os.path.exists(cfg.MOCK_IMAGE_DIR):
        files = sorted([f for f in os.listdir(cfg.MOCK_IMAGE_DIR) if f.endswith(".png")])
        for f in files:
            meta = labels_dict.get(f, {
                "class": "weed" if f.startswith("weed") else ("crop" if f.startswith("crop") else "background"),
                "target_present": not f.startswith("bg"),
                "target_area": 0,
                "center_x": 0,
                "center_y": 0,
                "scene_type": ""
            })
            records.append({
                "filename": f,
                "url": f"/static/mock_images/{f}",
                **meta
            })
    return {"images": records}

@app.post("/api/process")
def process_image(req: ProcessRequest):
    """Run OpenCV vision pipeline on specified or uploaded image with tunable parameters."""
    # Apply parameters dynamically
    cfg.EXG_THRESHOLD = req.exg_threshold
    cfg.MIN_MEAN_EXG = req.exg_threshold
    cfg.MIN_CONTOUR_AREA = req.min_contour_area
    cfg.MAX_CONTOUR_AREA = req.max_contour_area
    cfg.MIN_CIRCULARITY = req.min_circularity
    cfg.SHAPE_CUE_MIN_CIRCULARITY = req.min_circularity
    cfg.MIN_SOLIDITY = req.min_solidity
    cfg.SHAPE_CUE_MIN_SOLIDITY = req.min_solidity
    cfg.T_MIN_MS = req.t_min_ms
    cfg.T_MAX_MS = req.t_max_ms
    cfg.A_REF = req.a_ref
    cfg.FLOW_RATE_ML_S = req.flow_rate_ml_s
    cfg.BED_WIDTH_MM = req.bed_width_mm
    cfg.BED_HEIGHT_MM = req.bed_height_mm
    cfg.NOZZLE_OFFSET_X_MM = req.nozzle_offset_x_mm
    cfg.NOZZLE_OFFSET_Y_MM = req.nozzle_offset_y_mm

    # Load image
    if req.image_base64 and "," in req.image_base64:
        encoded_data = req.image_base64.split(",")[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_name = req.image_name or "uploaded_image.png"
    else:
        image_path = os.path.join(cfg.MOCK_IMAGE_DIR, req.image_name)
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Image not found: {req.image_name}")
        bgr = cv2.imread(image_path)
        image_name = req.image_name

    if bgr is None:
        raise HTTPException(status_code=400, detail="Failed to decode image.")

    # 1. Resize & Preprocess
    bgr = vp.resize_image(bgr)
    bgr_blurred = vp.apply_blur(bgr)
    rgb = vp.bgr_to_rgb_float(bgr_blurred)

    # 2. ExG
    exg = vp.compute_exg(rgb)

    # 3. Threshold & Morphology
    veg_mask = vp.threshold_exg(exg, threshold=cfg.EXG_THRESHOLD)
    clean_after_morph = vp.morphological_cleanup(veg_mask)
    clean_mask = vp.remove_small_blobs(clean_after_morph)

    # 4. Contours & Detections
    contours = vp.find_contours(clean_mask)
    detections = []
    coord_table = []
    fire_count = 0
    suppress_count = 0
    total_burst_ms = 0.0

    W, H = cfg.IMAGE_WIDTH, cfg.IMAGE_HEIGHT
    BW, BH = cfg.BED_WIDTH_MM, cfg.BED_HEIGHT_MM

    for idx, cnt in enumerate(contours):
        features = vp.extract_features(cnt, idx, exg)
        if not vp.is_candidate(features):
            continue
        c_pass, s_pass, decision = vp.dual_cue_gate(features)
        
        if decision == "FIRE":
            burst = vp.compute_burst_ms(features.area)
            volume = vp.compute_volume_ml(burst)
            fire_count += 1
            total_burst_ms += burst
        else:
            burst = 0.0
            volume = 0.0
            suppress_count += 1

        x_bed = (features.cx / (W - 1)) * BW
        y_bed = (features.cy / (H - 1)) * BH
        x_noz = x_bed + cfg.NOZZLE_OFFSET_X_MM
        y_noz = y_bed + cfg.NOZZLE_OFFSET_Y_MM

        det_dict = {
            "id": features.contour_id,
            "area_px": round(features.area, 1),
            "perimeter_px": round(features.perimeter, 1),
            "centroid_x": round(features.cx, 1),
            "centroid_y": round(features.cy, 1),
            "aspect_ratio": round(features.aspect_ratio, 3),
            "solidity": round(features.solidity, 3),
            "extent": round(features.extent, 3),
            "circularity": round(features.circularity, 3),
            "mean_exg": round(features.mean_exg, 3),
            "colour_cue": c_pass,
            "shape_cue": s_pass,
            "decision": decision,
            "burst_ms": round(burst, 1),
            "volume_ml": round(volume, 4),
        }
        detections.append(det_dict)

        coord_table.append({
            "target_id": f"#{features.contour_id}",
            "pixel_x": round(features.cx, 1),
            "pixel_y": round(features.cy, 1),
            "bed_x_mm": round(x_bed, 1),
            "bed_y_mm": round(y_bed, 1),
            "nozzle_x_mm": round(x_noz, 1),
            "nozzle_y_mm": round(y_noz, 1),
            "decision": decision
        })

    # Wrap into PipelineOutput to render annotated image
    det_objs = [
        vp.DetectionResult(
            features=vp.extract_features(contours[d["id"]], d["id"], exg),
            colour_cue=d["colour_cue"],
            shape_cue=d["shape_cue"],
            decision=d["decision"],
            burst_ms=d["burst_ms"],
            volume_ml=d["volume_ml"]
        )
        for d in detections if d["id"] < len(contours)
    ]
    p_out = vp.PipelineOutput(
        image_name=image_name,
        original=bgr,
        rgb=rgb,
        exg_map=exg,
        veg_mask=veg_mask,
        clean_mask=clean_mask,
        detections=det_objs
    )
    annotated = annotate_image(p_out)

    # Convert images to colored previews for frontend
    norm_exg = cv2.normalize(exg, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    exg_color = cv2.applyColorMap(norm_exg, cv2.COLORMAP_SUMMER)
    mask_color = cv2.applyColorMap(clean_mask, cv2.COLORMAP_SUMMER)

    targeted_vol = sum(d["volume_ml"] for d in detections)
    blanket_vol = cfg.FLOW_RATE_ML_S * cfg.VIRTUAL_TIME_PER_IMAGE_S
    saving_pct = 100 * (1 - targeted_vol / blanket_vol) if blanket_vol > 0 else 0

    # Arduino serial commands
    fire_dets = [d for d in detections if d["decision"] == "FIRE"]
    if fire_dets:
        arduino_cmds = [f"FIRE {int(d['burst_ms'])}" for d in fire_dets]
    else:
        arduino_cmds = ["SUPPRESS"]

    return {
        "image_name": image_name,
        "images": {
            "original": _np_to_base64(bgr),
            "exg_heatmap": _np_to_base64(exg_color),
            "clean_mask": _np_to_base64(mask_color),
            "annotated": _np_to_base64(annotated)
        },
        "detections": detections,
        "coordinates": coord_table,
        "dosing": {
            "total_burst_ms": round(total_burst_ms, 1),
            "targeted_volume_ml": round(targeted_vol, 4),
            "blanket_volume_ml": round(blanket_vol, 4),
            "saving_percent": round(saving_pct, 1),
            "assumed_flow_rate_ml_s": cfg.FLOW_RATE_ML_S,
            "virtual_time_s": cfg.VIRTUAL_TIME_PER_IMAGE_S
        },
        "arduino": {
            "commands": arduino_cmds,
            "active_burst_ms": int(fire_dets[0]["burst_ms"]) if fire_dets else 0,
            "status": "PULSE_TRIGGERED" if fire_dets else "INACTIVE"
        }
    }

@app.get("/api/events")
def get_events():
    """Return historical batch events from outputs/events.csv."""
    if not os.path.exists(cfg.EVENTS_CSV):
        return {"events": []}
    try:
        df = pd.read_csv(cfg.EVENTS_CSV, encoding="utf-8")
    except Exception:
        df = pd.read_csv(cfg.EVENTS_CSV, encoding="cp1252", encoding_errors="replace")
    return {"events": df.fillna("").to_dict(orient="records")}

@app.get("/api/analytics")
def get_analytics():
    """Return Review II summary metrics and markdown results."""
    table_md = ""
    table_path = os.path.join(cfg.OUTPUT_DIR, "review_ii_results_table.md")
    if os.path.exists(table_path):
        with open(table_path, "r", encoding="utf-8", errors="replace") as f:
            table_md = f.read()

    metrics = {}
    if os.path.exists(cfg.METRICS_CSV):
        try:
            m_df = pd.read_csv(cfg.METRICS_CSV, encoding="utf-8")
            metrics = m_df.iloc[0].to_dict()
        except Exception:
            pass

    plots = {
        "volume_comparison": "/static/outputs/volume_comparison.png",
        "confusion_matrix": "/static/outputs/confusion_matrix.png",
        "dose_distribution": "/static/outputs/dose_distribution.png",
        "detection_examples": "/static/outputs/detection_examples.png",
        "coordinate_visualization": "/static/outputs/coordinate_visualization.png",
    }
    return {
        "metrics": metrics,
        "table_markdown": table_md,
        "plots": plots
    }

# Serve built frontend if dist exists
dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api_server:app", host="0.0.0.0", port=port, reload=True)
