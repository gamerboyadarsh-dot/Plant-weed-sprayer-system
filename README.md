# Precision Micro-Dosing Weed Sprayer
## Software Proof-of-Concept | BACSE291 IDP | Project 202601383

**Team**: Akshita Parihar (25BRS1174) · Divyanshi Rai (25BRS1228) · Adarsh Agrawal (25BRS1226)

> ⚠️ **SIMULATION ONLY** — This is an initial software proof-of-concept.  
> No physical hardware has been constructed or tested at this stage.  
> All numeric results are computed from simulation assumptions.  
> Physical hardware integration is the next development phase.

---

## 1. Problem

Conventional agricultural weed control relies on **blanket spraying** — applying herbicide uniformly over the entire crop area. This approach wastes chemical resources (up to 90% of herbicide can land on non-weed surfaces), increases environmental contamination, and raises treatment cost.

A **precision micro-dosing system** would instead detect individual weed targets and spray only those locations, significantly reducing chemical usage in theory.

---

## 2. Objective

Build a low-cost, explainable, camera-guided weed detection and micro-dosing simulation that:

1. Detects vegetation targets using the **Excess Green Index (ExG)**
2. Confirms candidates with a **dual-cue (colour + shape) gate**
3. Computes a **size-scaled spray burst duration**
4. Calculates **theoretical liquid volume** and compares against a blanket baseline
5. Transforms detected pixel coordinates to **physical test-bed coordinates**
6. Logs every event to a **structured CSV**
7. Presents results in a **Streamlit dashboard**

---

## 3. System Architecture

```
Camera Image
      │
      ▼
┌─────────────────────────┐
│  1. Image Preprocessing │  Resize → BGR→RGB → Gaussian Blur
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Excess Green Index  │  ExG = 2g − r − b
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Vegetation Mask     │  ExG > threshold → binary mask
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  4. Morphological Clean │  Opening (noise) + Closing (holes)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  5. Contour Detection   │  cv2.findContours (RETR_EXTERNAL)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  6. Feature Extraction  │  Area, centroid, circularity, solidity, etc.
└──────────┬──────────────┘
           │
           ▼
┌────────────────────────────────────────────────────┐
│  7. Dual-Cue Confirmation Gate                     │
│                                                    │
│   Colour Cue:  mean_ExG ≥ threshold                │
│   Shape Cue:   area ∈ [min,max], circ ≥ min_circ  │
│                                                    │
│   Colour AND Shape → FIRE                          │
│   Otherwise        → SUPPRESS                      │
└──────────┬─────────────────────────────────────────┘
           │
      ┌────┴────┐
      │         │
   FIRE      SUPPRESS
      │
      ▼
┌─────────────────────────┐
│  8. Size-Scaled Dosing  │  T = clip(T_min + A/A_ref × ΔT, T_min, T_max)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  9. Volume Calculation  │  V = Q × burst_ms / 1000
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 10. Coordinate Transform│  x_bed = u/(W-1)×BW  → x_nozzle = x_bed + dx
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 11. Event Logging       │  → outputs/events.csv
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 12. Dashboard / Viz     │  Streamlit + Matplotlib
└─────────────────────────┘
```

---

## 4. Algorithms

### 4.1 Excess Green Index (ExG)

The ExG is a classical vegetation index for green plant detection:

```
Normalised channels:
    r = R / (R + G + B + ε)
    g = G / (R + G + B + ε)
    b = B / (R + G + B + ε)

ExG = 2g − r − b
```

- Positive ExG → green-biased (vegetation candidate)
- ε prevents division-by-zero on black pixels
- No deep learning required — works on standard CPU

### 4.2 Contour Features

| Feature | Formula | Meaning |
|---------|---------|---------|
| Area | `cv2.contourArea(c)` | Pixel area |
| Perimeter | `cv2.arcLength(c, True)` | Boundary length |
| Centroid | `M10/M00, M01/M00` | Geometric centre |
| Aspect Ratio | `width / height` | Shape elongation |
| Extent | `area / (bb_w × bb_h)` | Bounding-box fill |
| Solidity | `area / hull_area` | Convexity |
| Circularity | `4π·A / P²` | 1.0 = perfect circle |
| Mean ExG | `mean(ExG[mask])` | Colour strength inside |

### 4.3 Dual-Cue Confirmation Gate

| Colour Cue | Shape Cue | Decision |
|:----------:|:---------:|:--------:|
| ❌ | ❌ | SUPPRESS |
| ❌ | ✅ | SUPPRESS |
| ✅ | ❌ | SUPPRESS |
| ✅ | ✅ | 🔥 FIRE |

Requiring BOTH cues reduces false positives from non-vegetation green objects (equipment, labels, shadows).

### 4.4 Size-Scaled Burst Duration

```
T_burst = clip( T_min + (A / A_ref) × (T_max − T_min),  T_min,  T_max )
```

- `T_min`, `T_max`, `A_ref` are **simulation assumptions** in `config.py`
- Burst grows proportionally with target area, clamped to safe limits

### 4.5 Liquid Volume

```
V_target = Q × (burst_ms / 1000)
```

- `Q` = assumed flow rate [**SIMULATION ASSUMPTION** — pending pump calibration]

### 4.6 Blanket Baseline

```
T_blanket = n_images × VIRTUAL_TIME_PER_IMAGE_S
V_blanket = Q × T_blanket
```

- Virtual time window is a **software baseline**, not a physical measurement

### 4.7 Coordinate Transformation (Initial Approximation)

```
x_bed = (u / (W-1)) × BW
y_bed = (v / (H-1)) × BH

x_nozzle = x_bed + NOZZLE_OFFSET_X_MM
y_nozzle = y_bed + NOZZLE_OFFSET_Y_MM
```

- Assumes perfect top-down (nadir) camera mount
- Physical homography calibration is a future task

---

## 5. Dataset

The system uses a **synthetic/mock dataset** of 90 programmatically generated images:

| Class | Count | Description |
|-------|-------|-------------|
| Weed-like | 35 | Green blobs on soil background |
| Crop-like | 35 | Elongated green shapes (high aspect ratio) |
| Background | 20 | Soil only, no green targets |

⚠️ **These are NOT real agricultural images.**  
They are software test objects for pipeline validation only.

---

## 6. Simulation Assumptions

All assumptions are labelled in code and config.py:

| Parameter | Value | Status |
|-----------|-------|--------|
| Flow rate | 2.0 mL/s | SIMULATION ASSUMPTION |
| T_min | 80 ms | SIMULATION ASSUMPTION |
| T_max | 320 ms | SIMULATION ASSUMPTION |
| A_ref | 12,000 px² | SIMULATION ASSUMPTION |
| Bed dimensions | 500×400 mm | SIMULATION ASSUMPTION |
| Nozzle offset X | 50 mm | SIMULATION ASSUMPTION |
| Aim noise σ | 5 mm | SIMULATION ASSUMPTION |
| Virtual frame time | 0.5 s | SIMULATION ASSUMPTION |

---

## 7. How to Run

### Prerequisites

```bash
cd C:\Users\agraw\.gemini\antigravity\scratch\precision_micodosing_sim
pip install -r requirements.txt
```

### Step-by-step

```bash
# 1. Generate synthetic dataset
python generate_mock_dataset.py

# 2. Run batch detection + logging
python run_batch.py

# 3. Compare colour-only vs dual-cue gate
python compare_gates.py

# 4. Dose and baseline analysis
python dose_and_baseline.py

# 5. Coordinate simulation
python coordinate_simulation.py

# 6. Generate all report graphs
python create_report_assets.py

# 7. Run automated tests
pytest tests/ -v

# 8. Launch dashboard
streamlit run dashboard.py
```

---

## 8. Project Structure

```
precision_micodosing_sim/
├── README.md                  ← This file
├── requirements.txt           ← Python dependencies
├── config.py                  ← All tunable parameters
│
├── generate_mock_dataset.py   ← Synthetic dataset generator
├── vision_pipeline.py         ← Core CV pipeline
├── run_batch.py               ← Batch image processing
├── compare_gates.py           ← Gate comparison
├── dose_and_baseline.py       ← Volume analysis
├── coordinate_simulation.py   ← Coordinate transform
├── dashboard.py               ← Streamlit dashboard
├── create_report_assets.py    ← Graph generation
├── visualize.py               ← Annotation & plot utilities
├── logger.py                  ← CSV event logger
│
├── data/
│   ├── mock_images/           ← Generated test images
│   ├── labels/mock_labels.csv ← Ground truth labels
│   └── test_images/           ← Manual test images
│
├── outputs/
│   ├── annotated/             ← Annotated output images
│   ├── masks/                 ← ExG heatmaps and masks
│   ├── contours/              ← Pipeline figures
│   ├── events.csv             ← Per-detection event log
│   ├── metrics.csv            ← Batch summary metrics
│   ├── gate_comparison.csv    ← Gate comparison results
│   ├── coordinate_tests.csv   ← Coordinate transform tests
│   └── *.png                  ← Generated graphs
│
├── wokwi/
│   ├── sketch.ino             ← Arduino actuator simulation
│   ├── diagram.json           ← Wokwi circuit
│   └── README.md
│
├── tests/
│   └── test_pipeline.py       ← Automated tests (pytest)
│
└── docs/
    ├── TECHNICAL_DOCUMENTATION.md
    ├── SIMULATION_METHODOLOGY.md
    ├── REVIEW_II_RESULTS.md
    ├── ASSUMPTIONS_AND_LIMITATIONS.md
    ├── PPT_CONTENT.md
    └── PANEL_QA.md
```

---

## 9. Limitations

- Synthetic dataset only — real agricultural imagery not tested
- Green-on-green challenge (weeds in crops) not addressed
- Single-frame processing — no temporal tracking
- Linear coordinate model only — no perspective calibration
- No physical pump, nozzle, or spray validation
- No herbicide or field testing performed or planned at this stage

---

## 10. Hardware Integration Plan

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Software vision simulation | ✅ CURRENT |
| 2 | Pump bench calibration | 🔲 Planned |
| 3 | Arduino actuator control | 🔲 Planned |
| 4 | Raspberry Pi → Arduino serial | 🔲 Planned |
| 5 | Camera/nozzle mechanical calibration | 🔲 Planned |
| 6 | Physical test-bed construction | 🔲 Planned |
| 7 | Water spray landing validation | 🔲 Planned |
| 8 | End-to-end integration testing | 🔲 Planned |
| 9 | Optimisation | 🔲 Planned |

---

## 11. Future ML Upgrade

A lightweight model such as **MobileNet-SSD** or **YOLO-nano** is noted
as a possible future upgrade to handle:
- Green-on-green detection
- Multi-species classification
- Variable lighting robustness

The current classical ExG approach is intentionally chosen for:
- Explainability
- Low computational cost
- No training data requirement
- Suitability for 20%-stage proof-of-concept

---

## 12. Safety Note

For physical testing, use only **water** or **dyed water**.  
No actual herbicides during development or student demonstration phases.
