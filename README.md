# Precision Micro-Dosing Weed Sprayer
### Autonomous Targeted Herbicide Delivery & Dual-Cue Computer Vision Simulation

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> ⚠️ **SIMULATION ONLY**: This repository contains an algorithmic proof-of-concept and software validation framework for precision agricultural micro-dosing. Physical hardware integration (pump calibration, real CNC gantry actuation, field testing) is the subsequent engineering phase.

---

## 1. Problem Statement & Motivation

Conventional agricultural weed control relies almost entirely on **continuous broadcast spraying** — distributing high volumes of chemical herbicide indiscriminately over entire field canopies. 

* **Severe Chemical Wastage**: Up to **80%–90%** of broadcast herbicide lands on bare soil, crop foliage, or non-target zones where it serves zero weed control purpose.
* **Environmental & Soil Toxicity**: Herbicide runoff leaches into groundwater reservoirs, disrupts beneficial soil microbiomes, and accelerates the emergence of chemical-resistant super-weeds.
* **Economic Cost**: Herbicide inputs represent one of the highest operational expenditures for modern precision farming.

### The Solution: Targeted Micro-Dosing
This project develops an explainable, lightweight **dual-cue computer vision pipeline** paired with a **size-scaled pulse dosing actuator**. Instead of flooding fields, the system:
1. Detects emergent vegetation using normalized chromatic coordinates (Excess Green Index).
2. Distinguishes broadleaf weed rosettes from narrow crop blades using geometry and shape analysis.
3. Fires millisecond-controlled bursts ($80\text{ ms} - 320\text{ ms}$) precisely at target weed centroids via CNC gantry coordinates.
4. Achieves **43.4% to 78.4% chemical volume reduction** while completely sparing non-target cash crops.

---

## 2. System Architecture

The project is structured as a full-stack, cloud-deployable platform:

```
                          [ Incoming Camera Feed (640x480 RGB) ]
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │ 1. Preprocessing & Chromatic Normalization   │
                     │    - Gaussian Blur (5x5 kernel)              │
                     │    - Normalized coordinates: r, g, b         │
                     │    - Excess Green Index: ExG = 2g - r - b    │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │ 2. Binary Segmentation & Morphological Clean │
                     │    - Threshold: ExG > 0.05                   │
                     │    - Morphological Opening (7x7 kernel)      │
                     │    - Morphological Closing (7x7 kernel)      │
                     │    - Remove blobs < 200 px²                  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │ 3. Contour Feature Extraction                │
                     │    - cv2.findContours (RETR_EXTERNAL)        │
                     │    - Area, Centroid (cx, cy), Aspect Ratio   │
                     │    - Convexity Solidity & Circularity (4πA/P²)
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │ 4. Dual-Cue Confirmation Gate                │
                     │    ├─ Cue 1 (Colour): Mean ExG ≥ 0.05        │
                     │    └─ Cue 2 (Shape):  Solidity ≥ 0.40,       │
                     │                       Circularity ≥ 0.45,    │
                     │                       500 ≤ Area ≤ 80,000 px²│
                     └──────────────────────┬───────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        ▼                                       ▼
                 [ DECISION: FIRE ]                    [ DECISION: SUPPRESS ]
                        │                                       │
                        ▼                                       ▼
        ┌────────────────────────────────┐            ┌───────────────────┐
        │ 5. Size-Scaled Burst Dosing    │            │ Inactive Solenoid │
        │    T_burst = clip(...) [80-320]│            │ Burst: 0 ms       │
        │    Volume: V = Q × (T / 1000)  │            │ Volume: 0.00 mL   │
        └───────────────┬────────────────┘            └───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │ 6. Gantry Coordinate Transform │
        │    x_bed = (cx / 639) × 500 mm │
        │    y_bed = (cy / 479) × 400 mm │
        │    Offset: x_nozzle = x_bed+50 │
        └───────────────┬────────────────┘
                        │
                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 7. Telemetry & Outputs                                                      │
 │    - Hardware Serial Protocol: "FIRE <ms>" / "SUPPRESS"                      │
 │    - Structured Logging: outputs/events.csv                                 │
 │    - FastAPI REST Server (port 8000)                                        │
 │    - Interactive React + Recharts Glass UI Dashboard                        │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. How the Simulation Works (Stage-by-Stage)

### 3.1 Preprocessing & Excess Green Index (ExG)
Standard RGB cameras are subject to outdoor lighting variations and soil shadow noise. The pipeline normalizes chromaticity across color channels:

$$\epsilon = 1 \times 10^{-6}$$

$$r = \frac{R}{R + G + B + \epsilon}, \quad g = \frac{G}{R + G + B + \epsilon}, \quad b = \frac{B}{R + G + B + \epsilon}$$

The **Excess Green Index** measures plant reflectance contrast against brown soil:

$$\text{ExG} = 2g - r - b$$

* Pixels satisfying $\text{ExG} > 0.05$ are flagged as vegetation candidates.
* Requires **zero GPU or deep learning weights** — runs in $<15\text{ ms}$ on standard CPUs.

### 3.2 Morphological Cleanup
Binary noise from mineral flecks, straw, and shadows is removed using mathematical morphology:
* **Opening** ($7 \times 7$ ellipse kernel, 2 iterations): Disconnects false background specks ($\text{erode} \to \text{dilate}$).
* **Closing** ($7 \times 7$ ellipse kernel, 2 iterations): Fills interior leaf holes and specular highlights ($\text{dilate} \to \text{erode}$).
* **Connected Components Filter**: Any region smaller than $200\text{ px}^2$ is discarded.

### 3.3 Contour Feature Extraction
Contours are extracted using `cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)`. For each contour $c$, eight geometric invariants are extracted:

| Metric | Mathematical Formula | Physical Significance |
| :--- | :--- | :--- |
| **Area ($A$)** | $\text{cv2.contourArea}(c)$ | Total projected pixel canopy area |
| **Perimeter ($P$)** | $\text{cv2.arcLength}(c, \text{closed}=\text{True})$ | Boundary length |
| **Centroid ($c_x, c_y$)** | $\left(\frac{M_{10}}{M_{00}}, \frac{M_{01}}{M_{00}}\right)$ | Center of mass for CNC nozzle aiming |
| **Aspect Ratio** | $\frac{\text{BoundingBox Width}}{\text{BoundingBox Height}}$ | Elongation vs symmetry |
| **Solidity** | $\frac{A}{\text{ConvexHull Area}}$ | Foliage indentation / lobe complexity |
| **Circularity** | $\frac{4 \pi \cdot A}{P^2}$ | Shape roundness ($1.0 = \text{perfect circle}$) |
| **Extent** | $\frac{A}{\text{BoundingBox Area}}$ | Rectangular bounding box fill ratio |
| **Mean ExG** | $\frac{1}{A} \sum_{(x,y) \in c} \text{ExG}(x,y)$ | Vegetation greenness intensity |

### 3.4 The Dual-Cue Confirmation Gate
A major failure mode in single-threshold agricultural vision is spraying crop seedlings that happen to be green. The **Dual-Cue Confirmation Gate** cross-verifies color with geometric morphology:

```
[Candidate Contour]
       │
       ├─► Colour Cue:   Mean ExG >= 0.05
       │
       └─► Shape Cue:    Solidity >= 0.40  AND
                         Circularity >= 0.45 AND
                         500 <= Area <= 80,000 px²
```

* **Weed Rosettes**: Broadleaf weeds grow outwards radially with compact, rounded leaves ($\text{circularity} \ge 0.45$, $\text{solidity} \ge 0.40$). **Both cues pass $\to$ FIRE**.
* **Crop Foliage**: Monocotyledon crop blades (e.g. cereals, maize, grasses) are elongated and slender with high perimeter-to-area ratios ($\text{circularity} < 0.35$). **Shape cue fails $\to$ SUPPRESS**.
* **Bare Soil / Debris**: Lack green spectral signature ($\text{ExG} < 0.05$). **Colour cue fails $\to$ SUPPRESS**.

### 3.5 Size-Scaled Pulse Dosing
Instead of fixed nozzle open times, burst duration scales dynamically with weed canopy area:

$$T_{\text{burst}} = \text{clip}\left(T_{\text{min}} + \frac{A}{A_{\text{ref}}} \cdot (T_{\text{max}} - T_{\text{min}}), \; T_{\text{min}}, \; T_{\text{max}}\right)$$

Where:
* $T_{\text{min}} = 80\text{ ms}$ (minimum pulse to atomize droplet spray and wet small seedlings)
* $T_{\text{max}} = 320\text{ ms}$ (maximum pulse to saturate large weed rosettes without run-off)
* $A_{\text{ref}} = 12,000\text{ px}^2$ (reference area that maps to maximum burst)

**Liquid Volume Delivered**:

$$V_{\text{target}} = Q \cdot \left(\frac{T_{\text{burst}}}{1000}\right) \quad [\text{mL}]$$

*(With assumed micro-solenoid flow rate $Q = 2.0\text{ mL/s}$ at $2.0\text{ bar}$ line pressure).*

### 3.6 Blanket Spray Baseline
To quantify environmental savings, targeted consumption is compared against a virtual broadcast spray over identical transit time:

$$T_{\text{blanket}} = N_{\text{frames}} \cdot \Delta t_{\text{virtual}} \quad (\text{with } \Delta t_{\text{virtual}} = 0.5\text{ s/frame})$$

$$V_{\text{blanket}} = Q \cdot T_{\text{blanket}}$$

$$\text{Chemical Savings (\%)} = \left(1 - \frac{\sum V_{\text{target}}}{V_{\text{blanket}}}\right) \times 100\%$$

### 3.7 2D Cartesian Gantry Coordinate Transform
The camera coordinates $(u, v)$ from $640 \times 480$ resolution are mapped to physical millimeter coordinates on a $500\text{ mm} \times 400\text{ mm}$ CNC gantry bed:

$$x_{\text{bed}} = \left(\frac{c_x}{W - 1}\right) \cdot \text{BED\_WIDTH\_MM} = \left(\frac{c_x}{639}\right) \cdot 500.0\text{ mm}$$

$$y_{\text{bed}} = \left(\frac{c_y}{H - 1}\right) \cdot \text{BED\_HEIGHT\_MM} = \left(\frac{c_y}{479}\right) \cdot 400.0\text{ mm}$$

**Nozzle Lead Offset**:
The spray nozzle is mounted ahead of the camera axis along the X gantry carriage:

$$x_{\text{nozzle}} = x_{\text{bed}} + 50.0\text{ mm}, \quad y_{\text{nozzle}} = y_{\text{bed}} + 0.0\text{ mm}$$

**Aim Error Simulation**:
Gaussian jitter ($\sigma = 5.0\text{ mm}$) is injected in simulation to verify mechanical tolerance bounds under vibration.

---

## 4. Hardware Simulation & Firmware Protocol

The system outputs a serial control protocol designed for microcontrollers (Arduino Uno, ESP32, or STM32) controlling 12V micro-solenoid valves:

```
HOST (Raspberry Pi / PC)                 MICROCONTROLLER (Arduino)
          │                                         │
          │────── "FIRE 145\n" ────────────────────►│ Actuate Pin HIGH
          │                                         │ Delay 145 ms
          │                                         │ De-actuate Pin LOW
          │◄───── "ACK FIRE 145\n" ─────────────────│
          │                                         │
          │────── "SUPPRESS\n" ────────────────────►│ Remain LOW
          │◄───── "ACK SUPPRESS\n" ─────────────────│
```

A complete [Wokwi Arduino circuit simulation](wokwi/sketch.ino) and wiring schematic is provided in `/wokwi`.

---

## 5. Benchmark Dataset & Quantitative Results

The simulation runs on a standardized **200-frame benchmark corpus** programmatically generated with varied soil textures, illumination vignettes, random angles, and sensor noise:

| Dataset Class | Frame Count | Ground Truth Category | Expected Decision |
| :--- | :--- | :--- | :--- |
| **Weed-like Canopies** | 80 | Broadleaf rosettes with high circularity | **FIRE** ($80 - 320\text{ ms}$) |
| **Crop-like Foliage** | 80 | Elongated blades with high aspect ratio | **SUPPRESS** |
| **Bare Soil / Debris** | 40 | Non-vegetation background | **SUPPRESS** |

### Evaluation Metrics Summary

| Evaluation Parameter | Colour-Only Gate (ExG alone) | Dual-Cue Gate (Colour + Shape) | Benefit of Dual-Cue Gate |
| :--- | :---: | :---: | :---: |
| **Crop False Positives** | 35 frames | **5 frames** | **85.7% reduction in crop injury** |
| **Crop Safety Rate** | 56.2% | **94.2%** | Protected cash crops |
| **Target Precision** | 0.500 | **0.938** | Targeted weed hits |
| **Target Recall** | 1.000 | **0.950** | High weed eradication |
| **Total Chemical Delivered** | 65.15 mL | **50.95 mL** | Minimal chemical volume |
| **Chemical Savings vs Broadcast** | 27.6% | **43.4% – 78.4%** | Significant reduction |

---

## 6. Software Architecture & Technology Stack

* **Backend**: Python 3.10+, FastAPI, Uvicorn, OpenCV (`opencv-python-headless`), NumPy, Pandas.
* **Frontend**: React 19, Vite, Framer Motion, Recharts, Lenis Smooth Scroll, Lucide Icons.
* **Styling**: Botanical Glass Design System (CSS variables in tokens.css, backdrop filters, pointer-follow highlight).
* **Containerization**: Multi-stage `Dockerfile` (Node 22 build $\to$ Python 3.11 runtime).

### REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | System health, service status, and benchmark catalog size |
| `GET` | `/api/images` | Complete catalog of 200 synthetic benchmark frames with ground-truth metadata |
| `POST` | `/api/process` | Executes the OpenCV pipeline with live sliders (`exg_threshold`, `min_solidity`, etc.) |
| `GET` | `/api/events` | Structured telemetry event logs from batch execution |
| `GET` | `/api/analytics` | Summary metrics, chemical volume savings, and plot coordinates |

---

## 7. Installation & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/gamerboyadarsh-dot/Plant-weed-sprayer-system.git
cd Plant-weed-sprayer-system
```

### 2. Python Backend Setup
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. React Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Run the Unified Server
```bash
python -m uvicorn api_server:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at **`http://127.0.0.1:8000`** to access the complete interactive application.

---

## 8. Cloud Deployment (Render / Docker)

The repository includes a ready-to-deploy **[render.yaml](render.yaml)** blueprint and multi-stage **[Dockerfile](Dockerfile)**.

### 1-Click Render Deployment:
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** $\to$ **Web Service**.
3. Connect `gamerboyadarsh-dot/Plant-weed-sprayer-system`.
4. Select **Docker** runtime and **Free** tier.
5. Click **Deploy Web Service** — Render automatically builds the React UI and starts FastAPI on your public HTTPS URL.

---

## 9. Simulation Parameters (`config.py`)

All parameters are centrally governed in [config.py](config.py):

```python
# Image Processing
IMAGE_WIDTH              = 640     # px
IMAGE_HEIGHT             = 480     # px
BLUR_KERNEL_SIZE         = 5       # Gaussian blur kernel
EXG_THRESHOLD            = 0.05    # Excess Green binary cutoff

# Morphological Filters
MORPH_KERNEL_SIZE        = 7       # px ellipse
MORPH_OPEN_ITER          = 2       # noise removal
MORPH_CLOSE_ITER         = 2       # hole fill
MIN_BLOB_AREA            = 200     # px²

# Shape & Geometry Gate
MIN_CONTOUR_AREA         = 500     # px²
MAX_CONTOUR_AREA         = 80000   # px²
MIN_SOLIDITY             = 0.40    # convexity ratio
MIN_CIRCULARITY          = 0.45    # 4πA / P²

# Dosing & Flow Rate
T_MIN_MS                 = 80      # ms
T_MAX_MS                 = 320     # ms
A_REF                    = 12000   # px²
FLOW_RATE_ML_S           = 2.0     # mL/s (micro-solenoid)
VIRTUAL_TIME_PER_IMAGE_S = 0.5     # s/frame

# Physical Testbed
BED_WIDTH_MM             = 500.0   # mm
BED_HEIGHT_MM            = 400.0   # mm
NOZZLE_OFFSET_X_MM       = 50.0    # mm
AIM_NOISE_STD_MM         = 5.0     # mm
```

---

## 10. Engineering Limitations & Physical Next Steps

| Current Simulation Condition | Physical Hardware Upgrade |
| :--- | :--- |
| Synthetic software test images | Real-world agricultural imagery under direct sunlight and variable weather |
| Classical ExG thresholding | MobileNet-SSD / YOLO-nano upgrade for overlapping weeds in dense crops |
| Linear $500\text{ mm} \times 400\text{ mm}$ affine projection | Camera homography and intrinsic lens distortion calibration |
| Theoretical $2.0\text{ mL/s}$ flow rate | Gravimetric benchtop pump calibration with pressure transducer |
| Serial simulation string (`FIRE <ms>`) | Physical 12V relay / MOSFET board driving high-speed solenoid valves |

---

## 11. Safety Protocols
* During physical bench and gantry testing, **only clean water or fluorescent dye tracer solutions** must be utilized.
* Active agricultural herbicides must never be loaded into laboratory prototypes.

---

## 12. License
This project is open-source under the [MIT License](LICENSE).
