# PPT SLIDE CONTENT
## Precision Micro-Dosing Weed Sprayer — BACSE291 Review II
## Project ID: 202601383

---

## SLIDE 1 — TITLE

**Title**: Precision Micro-Dosing Weed Sprayer

**Subtitle**: BACSE291 Innovative Design Project — Review II

**Team**:
- Akshita Parihar — 25BRS1174
- Divyanshi Rai — 25BRS1228
- Adarsh Agrawal — 25BRS1226

**Project ID**: 202601383

**Date**: September 2026

**Visual**: System block diagram thumbnail or green crop field image

---

## SLIDE 2 — PROBLEM

**Title**: The Problem with Blanket Spraying

**Bullets**:
- Conventional herbicide application sprays the ENTIRE field uniformly
- Up to 90% of chemical may land on non-weed surfaces (theoretical estimate)
- Excess chemical = wasted cost + environmental contamination
- Herbicide resistance accelerated by over-application
- Small farmers need low-cost, precise alternatives

**Visual**: Split image — blanket spray (red X) vs precision spray (green check)

**Presenter note**: "The core problem is inefficiency — we spray everywhere even though weeds occupy only a small fraction of the total area."

---

## SLIDE 3 — PROBLEM STATEMENT AND OBJECTIVES

**Title**: Problem Statement and Objectives

**Problem Statement**:
Design and simulate a low-cost, camera-guided, precision micro-dosing weed detection and spray system using classical computer vision.

**Objectives**:
- Detect vegetation targets using Excess Green Index (ExG)
- Confirm candidates with dual-cue (colour + shape) gate
- Compute size-scaled spray dose
- Transform detected coordinates to nozzle aim point
- Log all events and compare against blanket baseline
- Demonstrate via software simulation (Review II scope)

**Visual**: Numbered objective list with icons

---

## SLIDE 4 — SCOPE AND CONSTRAINTS

**Title**: Scope and Constraints

**In Scope (Review II)**:
- Software-only simulation
- Classical OpenCV pipeline
- 90-image synthetic dataset
- Streamlit demonstration dashboard
- Wokwi Arduino actuator simulation

**Out of Scope (Review II)**:
- Physical hardware construction
- Real agricultural field testing
- Actual herbicide use
- Deep learning models (future upgrade)

**Constraint**: No hardware → all results are SIMULATION ONLY

**Visual**: Scope boundary diagram

---

## SLIDE 5 — EXISTING APPROACHES / LITERATURE

**Title**: Existing Approaches and Project Context

**Bullets**:
- Commercial WEED-IT (optical boom sprayer) — expensive, not DIY-accessible
- Research: ExG index widely used for vegetation detection (Woebbecke et al., 1995)
- Research: Shape-based crop/weed discrimination (Granitto et al., 2005)
- Research: Selective spraying using image processing (Pérez et al., 2000)
- Gap: Low-cost, reproducible, explainable tabletop system for student/research use

**Project differentiation**:
- Size-scaled dosing rule
- Dual-cue confirmation (not just colour)
- Low-cost open-source stack

**Presenter note**: "We are not claiming our concept is globally novel — precise spraying exists commercially. Our goal is a low-cost, reproducible implementation."

---

## SLIDE 6 — SYSTEM ARCHITECTURE

**Title**: System Architecture

**Diagram**: Full pipeline flowchart (see README Architecture section)

**Key stages**:
1. Image input → 2. ExG computation → 3. Vegetation masking
4. Contour extraction → 5. Feature computation → 6. Dual-cue gate
7. Dosing → 8. Coordinate transform → 9. Event log → 10. Dashboard

**Visual**: Block flow diagram (use the ASCII art from README, converted to PowerPoint shapes)

**Presenter note**: "Each stage is a separate Python module. Parameters are centralised in config.py for easy tuning."

---

## SLIDE 7 — VISION ALGORITHM

**Title**: Vegetation Detection Algorithm

**Equation** (display prominently):
```
Normalised channels:
  r = R/(R+G+B)   g = G/(R+G+B)   b = B/(R+G+B)

Excess Green Index:
  ExG = 2g − r − b
```

**Bullets**:
- Positive ExG → green-biased → vegetation candidate
- Threshold applied → binary mask
- Morphological opening removes noise
- Morphological closing fills holes
- Small blobs (<200 px²) discarded

**Visual**: 3-panel image: Original | ExG heatmap | Clean mask

**Key number**: ExG threshold = 0.05 [simulation assumption]

---

## SLIDE 8 — DUAL-CUE CONFIRMATION GATE

**Title**: Dual-Cue Confirmation Gate

**Truth Table** (prominent visual):

| Colour Cue | Shape Cue | Decision |
|:----------:|:---------:|:--------:|
| ❌ | ❌ | SUPPRESS |
| ❌ | ✅ | SUPPRESS |
| ✅ | ❌ | SUPPRESS |
| ✅ | ✅ | 🔥 FIRE |

**Colour Cue**: mean ExG ≥ 0.05 inside contour

**Shape Cue**: area ∈ [500, 80000] px², solidity ≥ 0.40, circularity ≥ 0.15

**Why dual-cue**: Reduces false positives from green equipment, labels, shadows

**Circularity formula**: `C = 4πA / P²`  (1.0 = perfect circle)

**Visual**: Annotated detection image with FIRE / SUPPRESS labels

---

## SLIDE 9 — SIZE-SCALED DOSING

**Title**: Size-Scaled Spray Dosing

**Formula** (display prominently):
```
T_burst = clip( T_min + (A / A_ref) × (T_max − T_min),  T_min,  T_max )

V_target = Q × (T_burst / 1000)
```

**Parameters** [ALL SIMULATION ASSUMPTIONS]:
- T_min = 80 ms, T_max = 320 ms, A_ref = 12,000 px²
- Q = 2.0 mL/s (assumed — physical calibration pending)

**Blanket baseline** [simulation only]:
```
V_blanket = Q × (n_frames × 0.5 s)
```

**Visual**: Bar chart — targeted volume vs blanket baseline

**Important disclaimer**: "All values are simulation assumptions. No physical pump calibration has been performed."

---

## SLIDE 10 — SIMULATION METHODOLOGY

**Title**: Simulation Methodology

**Bullets**:
- 90 synthetic images generated programmatically (35 weed, 35 crop, 20 background)
- Variations: position, size, orientation, brightness, noise, shadows
- Ground-truth labels in mock_labels.csv
- Pipeline run in batch — events logged to CSV
- Gate comparison: colour-only vs dual-cue
- All results explicitly labelled SIMULATION ONLY

**Diagram**: Simulation workflow flowchart

**Important**: "Synthetic objects are NOT real weeds. They are controlled software test objects."

---

## SLIDE 11 — SIMULATION RESULTS TABLE

**Title**: Simulation Results [SIMULATION ONLY]

| Metric | Result | Status |
|--------|--------|--------|
| Images processed | 90 | Simulation |
| FIRE events | (from run) | Simulation |
| SUPPRESS events | (from run) | Simulation |
| Dual-cue Precision | (from run) | Simulation |
| Dual-cue Recall | (from run) | Simulation |
| Colour-only FPR | (from run) | Simulation |
| Dual-cue FPR | (from run) | Simulation |
| Targeted volume | X.XX mL | Simulation |
| Blanket baseline | X.XX mL | Simulation |
| Theoretical reduction | XX% | Simulation |

**Footer**: "Results on synthetic dataset. Not field validated. Physical calibration pending."

**Visual**: Confusion matrix / bar chart comparing gates

---

## SLIDE 12 — COORDINATE / AIMING SIMULATION

**Title**: Camera-to-Nozzle Coordinate Transformation

**Initial model** [SIMULATION ASSUMPTION]:
```
x_bed    = (u / (W−1)) × BW
y_bed    = (v / (H−1)) × BH
x_nozzle = x_bed + Δx
y_nozzle = y_bed + Δy
```

**Parameters**: BW=500 mm, BH=400 mm, Δx=50 mm, Δy=0 mm [assumed]

**Aim error model**: Gaussian noise σ=5 mm [SIMULATION ASSUMPTION]

**Future**: 4-point homography calibration

**Visual**: Scatter plot — pixel space (left) and bed space with nozzle offset arrows (right)

---

## SLIDE 13 — HARDWARE ARCHITECTURE AND BOM

**Title**: Planned Hardware Architecture

**Diagram**: Block diagram
```
Camera
  │
  ▼
Raspberry Pi 4 (Vision + Decision)
  │ Serial (FIRE <ms>)
  ▼
Arduino Uno (Actuator Controller)
  │
  ▼
MOSFET/Relay → Solenoid Valve → Nozzle
               12V Pump ─────┘
```

**Bill of Materials (estimated)**:
| Component | Est. Cost |
|-----------|----------|
| Raspberry Pi 4 | ₹4,000–6,000 |
| Arduino Uno | ₹300–800 |
| Camera | ₹500–1,500 |
| Solenoid Valve | ₹300–600 |
| Pump | ₹500–1,000 |
| MOSFET/Relay | ₹50–150 |
| Frame / Test-bed | ₹500–1,500 |
| **Total** | **~₹7,000–12,000** |

**Status**: Hardware NOT yet purchased. Future integration phase.

---

## SLIDE 14 — VALIDATION PLAN

**Title**: Validation Plan

**Software validation** (CURRENT):
- Unit tests on synthetic NumPy arrays (pytest, 30+ tests)
- Batch pipeline on 90 synthetic images
- Gate comparison: colour-only vs dual-cue
- Coordinate model verification with known pixel → mm mappings

**Hardware validation** (FUTURE):
- Pump flow rate bench test (graduated cylinder)
- Coordinate calibration with reference markers
- Spray landing point accuracy (water on paper target)
- End-to-end integration test (camera → Pi → Arduino → solenoid)

**Visual**: Validation phase table (current vs future)

---

## SLIDE 15 — REVIEW-II PROGRESS AND NEXT STEPS

**Title**: Current Status and Next Steps

**Progress at Review II (≈20%)**:
✅ Requirement analysis  
✅ System architecture design  
✅ Component/technology selection  
✅ Software simulation: vision pipeline, dual-cue gate, dosing, coordinates, dashboard  
✅ Wokwi Arduino simulation  
✅ Documentation and panel preparation  

**Next Steps**:
- Phase 2: Pump bench calibration
- Phase 3: Arduino actuator control
- Phase 4: Raspberry Pi ↔ Arduino serial link
- Phase 5: Camera calibration on test bed
- Phase 6: Physical test-bed construction
- Phase 7: Water spray validation

**Framing**: "Approximately 20% of the project scope has been completed through software-based vision, dosing, coordinate, and actuator-logic simulations. Physical hardware integration is the next planned phase."
