"""
dashboard.py
============
Streamlit dashboard for the Precision Micro-Dosing Weed Sprayer simulation.

Title: Precision Micro-Dosing Weed Sprayer - Software Proof-of-Concept
BACSE291 Review II Demonstration

Usage
-----
    streamlit run dashboard.py

All results displayed are SIMULATION ONLY.
No physical hardware exists at this stage.
"""

import os
import io
import tempfile
import cv2
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image

import config as cfg
from vision_pipeline import run_pipeline
from visualize import annotate_image

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Weed Sprayer - Software PoC",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for styling
st.markdown("""
<style>
    .metric-card {
        background-color: #1e2530;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #2d3748;
        margin-bottom: 10px;
    }
    .decision-fire {
        background: linear-gradient(135deg, #781c1c, #d32f2f);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 28px;
        box-shadow: 0 4px 12px rgba(211,47,47,0.3);
    }
    .decision-suppress {
        background: linear-gradient(135deg, #1a365d, #2b6cb0);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 28px;
        box-shadow: 0 4px 12px rgba(43,108,176,0.3);
    }
    .decision-nocand {
        background: linear-gradient(135deg, #2d3748, #4a5568);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 28px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Load Dataset Metadata
# ---------------------------------------------------------------------------
labels_df = None
if os.path.exists(cfg.MOCK_LABELS_CSV):
    try:
        labels_df = pd.read_csv(cfg.MOCK_LABELS_CSV, encoding="utf-8")
    except Exception:
        labels_df = pd.read_csv(cfg.MOCK_LABELS_CSV, encoding="cp1252", encoding_errors="replace")

mock_files = []
if os.path.exists(cfg.MOCK_IMAGE_DIR):
    mock_files = sorted([f for f in os.listdir(cfg.MOCK_IMAGE_DIR) if f.endswith(".png")])

# ---------------------------------------------------------------------------
# Sidebar Configuration
# ---------------------------------------------------------------------------
st.sidebar.title("🌿 Weed Sprayer PoC")
st.sidebar.caption("BACSE291 IDP - Project ID: 202601383")
st.sidebar.caption("Team: Akshita Parihar · Divyanshi Rai · Adarsh Agrawal")
st.sidebar.divider()

st.sidebar.subheader("1. Input Image Selection")
input_mode = st.sidebar.radio(
    "Choose Image Source:",
    ("Synthetic Dataset (90 Images)", "Upload Custom Image"),
    index=0
)

selected_image_path = None
selected_image_name = None
gt_class = "Unknown"

if input_mode == "Synthetic Dataset (90 Images)":
    # Category filter
    category = st.sidebar.selectbox(
        "Filter by Class:",
        ("All (90 Images)", "Weed Targets (35)", "Crop Targets (35)", "Soil Backgrounds (20)"),
        index=1  # Default to Weed Targets so interesting results show immediately
    )
    
    if category == "Weed Targets (35)":
        filtered_files = [f for f in mock_files if f.startswith("weed_")]
    elif category == "Crop Targets (35)":
        filtered_files = [f for f in mock_files if f.startswith("crop_")]
    elif category == "Soil Backgrounds (20)":
        filtered_files = [f for f in mock_files if f.startswith("bg_")]
    else:
        filtered_files = mock_files

    # Quick demo buttons
    st.sidebar.caption("Quick Panel Demo Presets:")
    col_p1, col_p2, col_p3 = st.sidebar.columns(3)
    if col_p1.button("🎯 Weed", help="Case 1: Clear Weed -> FIRE"):
        st.session_state["chosen_file"] = "weed_0001.png"
    if col_p2.button("🌾 Crop", help="Case 2: Crop Blade -> SUPPRESS"):
        st.session_state["chosen_file"] = "crop_0001.png"
    if col_p3.button("🟤 Soil", help="Case 3: Blank Soil -> NO CANDIDATE"):
        st.session_state["chosen_file"] = "bg_0001.png"

    current_choice = st.session_state.get("chosen_file", "weed_0001.png")
    if current_choice not in filtered_files and filtered_files:
        current_choice = filtered_files[0]

    chosen_file = st.sidebar.selectbox(
        "Select Image:",
        filtered_files,
        index=filtered_files.index(current_choice) if current_choice in filtered_files else 0
    )
    st.session_state["chosen_file"] = chosen_file
    
    if chosen_file:
        selected_image_path = os.path.join(cfg.MOCK_IMAGE_DIR, chosen_file)
        selected_image_name = chosen_file
        if labels_df is not None:
            match = labels_df[labels_df["filename"] == chosen_file]
            if not match.empty:
                gt_class = match.iloc[0]["ground_truth_class"]
else:
    uploaded_file = st.sidebar.file_uploader(
        "Upload JPG / PNG", type=["jpg", "jpeg", "png"]
    )
    if uploaded_file is not None:
        suffix = os.path.splitext(uploaded_file.name)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(uploaded_file.read())
            selected_image_path = tmp.name
        selected_image_name = uploaded_file.name

st.sidebar.divider()
st.sidebar.subheader("2. Vision Parameters")
exg_thresh = st.sidebar.slider("ExG Threshold", 0.01, 0.30, float(cfg.EXG_THRESHOLD), 0.005)
min_area = st.sidebar.number_input("Min Contour Area (px2)", 100, 5000, int(cfg.MIN_CONTOUR_AREA), 100)
max_area = st.sidebar.number_input("Max Contour Area (px2)", 1000, 200000, int(cfg.MAX_CONTOUR_AREA), 1000)
min_circ = st.sidebar.slider("Min Circularity (4piA/P2)", 0.05, 0.80, float(cfg.MIN_CIRCULARITY), 0.01)
min_solid = st.sidebar.slider("Min Solidity", 0.10, 0.90, float(cfg.MIN_SOLIDITY), 0.05)

st.sidebar.subheader("3. Dosing Parameters")
t_min = st.sidebar.number_input("T_min (ms)", 20, 200, int(cfg.T_MIN_MS), 10)
t_max = st.sidebar.number_input("T_max (ms)", 100, 500, int(cfg.T_MAX_MS), 10)
a_ref = st.sidebar.number_input("A_ref (px2)", 1000, 50000, int(cfg.A_REF), 500)

st.sidebar.subheader("4. Flow Rate [Simulation Assumption]")
flow_rate = st.sidebar.number_input("Flow Rate (mL/s) [Assumed]", 0.1, 20.0, float(cfg.FLOW_RATE_ML_S), 0.1)
st.sidebar.caption("⚠️ Placeholder flow rate; physical pump calibration pending.")

st.sidebar.subheader("5. Coordinate Parameters")
bed_w = st.sidebar.number_input("Bed Width (mm)", 100, 2000, int(cfg.BED_WIDTH_MM), 50)
bed_h = st.sidebar.number_input("Bed Height (mm)", 100, 2000, int(cfg.BED_HEIGHT_MM), 50)
nozzle_dx = st.sidebar.number_input("Nozzle Offset X (mm)", -200, 200, int(cfg.NOZZLE_OFFSET_X_MM), 5)
nozzle_dy = st.sidebar.number_input("Nozzle Offset Y (mm)", -200, 200, int(cfg.NOZZLE_OFFSET_Y_MM), 5)

# Runtime config overrides
cfg.EXG_THRESHOLD = exg_thresh
cfg.MIN_CONTOUR_AREA = min_area
cfg.MAX_CONTOUR_AREA = max_area
cfg.MIN_CIRCULARITY = min_circ
cfg.MIN_MEAN_EXG = exg_thresh
cfg.SHAPE_CUE_MIN_CIRCULARITY = min_circ
cfg.SHAPE_CUE_MIN_AREA = min_area
cfg.SHAPE_CUE_MAX_AREA = max_area
cfg.MIN_SOLIDITY = min_solid
cfg.SHAPE_CUE_MIN_SOLIDITY = min_solid
cfg.T_MIN_MS = t_min
cfg.T_MAX_MS = t_max
cfg.A_REF = a_ref
cfg.FLOW_RATE_ML_S = flow_rate
cfg.BED_WIDTH_MM = float(bed_w)
cfg.BED_HEIGHT_MM = float(bed_h)
cfg.NOZZLE_OFFSET_X_MM = float(nozzle_dx)
cfg.NOZZLE_OFFSET_Y_MM = float(nozzle_dy)

# ---------------------------------------------------------------------------
# Header & Review II Banner
# ---------------------------------------------------------------------------
st.title("🌿 Precision Micro-Dosing Weed Sprayer")
st.subheader("Software Proof-of-Concept — BACSE291 Innovative Design Project Review II")
st.markdown(
    "> ⚠️ **SIMULATION ONLY** — *Initial software proof-of-concept and simulation before hardware integration.* "
    "All synthetic imagery, flow rates, and coordinate mappings are simulation assumptions."
)

# ---------------------------------------------------------------------------
# Navigation Tabs
# ---------------------------------------------------------------------------
tab_pipeline, tab_analytics, tab_events, tab_gallery = st.tabs([
    "🔬 Single Image Vision Pipeline",
    "📊 Review II Simulation Analytics",
    "📋 Structured Event Log",
    "🖼️ Synthetic Dataset Gallery (90 Images)"
])

# Helper Image Converters
def bgr_to_pil(bgr_img: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB))

def float_mask_to_pil(mask: np.ndarray) -> Image.Image:
    normed = cv2.normalize(mask, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    coloured = cv2.applyColorMap(normed, cv2.COLORMAP_SUMMER)
    return Image.fromarray(cv2.cvtColor(coloured, cv2.COLOR_BGR2RGB))

def binary_mask_to_pil(mask: np.ndarray) -> Image.Image:
    coloured = cv2.applyColorMap(mask, cv2.COLORMAP_SUMMER)
    return Image.fromarray(cv2.cvtColor(coloured, cv2.COLOR_BGR2RGB))


# ===========================================================================
# TAB 1: SINGLE IMAGE VISION PIPELINE
# ===========================================================================
with tab_pipeline:
    if selected_image_path is None or not os.path.exists(selected_image_path):
        st.info("👈 Please select or upload an image from the sidebar to inspect.")
    else:
        # Run CV pipeline
        out = run_pipeline(selected_image_path, selected_image_name)

        if out.error:
            st.error(f"Error executing pipeline: {out.error}")
        else:
            # Metadata Banner
            st.markdown(f"### Inspecting: `{selected_image_name}` (Ground Truth Class: **{gt_class.upper()}**)")
            
            # --- SECTION 2: 4-STAGE VISION PIPELINE ---
            st.markdown("#### 🔬 Computer Vision Stages")
            c1, c2, c3, c4 = st.columns(4)
            with c1:
                st.image(bgr_to_pil(out.original), caption="① Original Input", use_container_width=True)
            with c2:
                st.image(float_mask_to_pil(out.exg_map), caption=f"② ExG Map (ExG = 2g - r - b)", use_container_width=True)
            with c3:
                st.image(binary_mask_to_pil(out.clean_mask), caption=f"③ Cleaned Vegetation Mask", use_container_width=True)
            with c4:
                ann_bgr = annotate_image(out)
                st.image(bgr_to_pil(ann_bgr), caption="④ Annotated Detection", use_container_width=True)

            st.divider()

            # --- SECTION 3 & 4: CANDIDATE FEATURES & DUAL-CUE CONFIRMATION ---
            col_left, col_right = st.columns([3, 2])

            with col_left:
                st.markdown("#### 🎯 Detected Candidate Features")
                n_cands = len(out.detections)
                
                if n_cands == 0:
                    st.warning("⚠️ No valid vegetation candidate detected in this image.")
                    st.markdown("""
                    **Reason**: The region either did not meet the vegetation threshold (`ExG > 0.05`) 
                    or the detected contours fell below the minimum area threshold (`500 px²`).
                    """)
                else:
                    feature_rows = []
                    for det in out.detections:
                        f = det.features
                        feature_rows.append({
                            "ID": f"#{f.contour_id}",
                            "Area (px²)": f"{int(f.area)}",
                            "Centroid (X,Y)": f"({f.cx:.1f}, {f.cy:.1f})",
                            "Aspect Ratio": f"{f.aspect_ratio:.2f}",
                            "Solidity": f"{f.solidity:.2f}",
                            "Circularity": f"{f.circularity:.2f}",
                            "Mean ExG": f"{f.mean_exg:.3f}",
                            "Decision": det.decision
                        })
                    st.dataframe(pd.DataFrame(feature_rows), use_container_width=True)

            with col_right:
                st.markdown("#### ⚡ Dual-Cue Confirmation Gate")
                
                if n_cands == 0:
                    st.markdown("""
                    <div class="decision-nocand">
                        ⚪ NO CANDIDATE
                        <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">
                            Zero spray actuated - Actuator OFF
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    for det in out.detections:
                        f = det.features
                        c_pass = det.colour_cue
                        s_pass = det.shape_cue
                        
                        col_c1, col_c2 = st.columns(2)
                        with col_c1:
                            st.metric("Colour Cue (ExG >= thresh)", "PASS ✅" if c_pass else "FAIL ❌")
                        with col_c2:
                            st.metric("Shape Cue (Area, Circ, Solid)", "PASS ✅" if s_pass else "FAIL ❌")

                        if det.decision == "FIRE":
                            st.markdown(f"""
                            <div class="decision-fire">
                                🔥 FIRE — CANDIDATE #{f.contour_id}
                                <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">
                                    Both Colour and Shape cues confirmed — Actuator triggered!
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                        else:
                            st.markdown(f"""
                            <div class="decision-suppress">
                                🚫 SUPPRESS — CANDIDATE #{f.contour_id}
                                <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">
                                    Failed confirmation gate — Actuator suppressed!
                                </div>
                            </div>
                            """, unsafe_allow_html=True)

            st.divider()

            # --- SECTION 5 & 6: DOSING & COORDINATE TRANSFORMATION ---
            col_dose, col_coord = st.columns(2)

            with col_dose:
                st.markdown("#### 💧 Size-Scaled Dosing & Volume [Simulation]")
                fire_dets = [d for d in out.detections if d.decision == "FIRE"]
                
                if not fire_dets:
                    st.info("ℹ️ Target SUPPRESSED or not detected -> Burst duration = **0 ms**, Volume = **0.00 mL**.")
                else:
                    for det in fire_dets:
                        f = det.features
                        d1, d2 = st.columns(2)
                        d1.metric(f"Burst Duration (Target #{f.contour_id})", f"{det.burst_ms:.1f} ms")
                        d2.metric(f"Theoretical Dose", f"{det.volume_ml:.4f} mL")
                    
                    total_v = sum(d.volume_ml for d in fire_dets)
                    blanket_v = flow_rate * cfg.VIRTUAL_TIME_PER_IMAGE_S
                    saving_pct = 100 * (1 - total_v / blanket_v) if blanket_v > 0 else 0

                    st.write(f"**Targeted Micro-Dose:** `{total_v:.4f} mL`")
                    st.write(f"**Blanket Spray Baseline:** `{blanket_v:.4f} mL` *(0.5s virtual window)*")
                    st.success(f"**Theoretical Volume Reduction:** `{saving_pct:.1f}%` reduction in software simulation")

            with col_coord:
                st.markdown("#### 📍 Bed & Nozzle Coordinates [Simulation]")
                if n_cands == 0:
                    st.info("No candidate coordinates to transform.")
                else:
                    coord_table = []
                    W, H = cfg.IMAGE_WIDTH, cfg.IMAGE_HEIGHT
                    BW, BH = cfg.BED_WIDTH_MM, cfg.BED_HEIGHT_MM
                    for det in out.detections:
                        f = det.features
                        x_bed = (f.cx / (W - 1)) * BW
                        y_bed = (f.cy / (H - 1)) * BH
                        x_noz = x_bed + cfg.NOZZLE_OFFSET_X_MM
                        y_noz = y_bed + cfg.NOZZLE_OFFSET_Y_MM
                        coord_table.append({
                            "Target": f"#{f.contour_id}",
                            "Pixel (u, v)": f"({f.cx:.0f}, {f.cy:.0f})",
                            "Bed (X, Y) mm": f"({x_bed:.1f}, {y_bed:.1f})",
                            "Nozzle Target (X, Y) mm": f"({x_noz:.1f}, {y_noz:.1f})"
                        })
                    st.dataframe(pd.DataFrame(coord_table), use_container_width=True)

            st.divider()

            # --- SECTION 7: ARDUINO SERIAL SIMULATION ---
            st.markdown("#### 🔌 Wokwi / Arduino Serial Actuation Output")
            st.caption("Validates serial protocol timing logic: Raspberry Pi sends command -> Arduino receives, switches virtual actuator (pin 13 LED), and deactivates.")
            
            if fire_dets:
                serial_cmds = "\n".join([f"FIRE {int(d.burst_ms)}" for d in fire_dets])
                st.code(serial_cmds, language="text")
                st.success(f"Command `FIRE {int(fire_dets[0].burst_ms)}` issued to Arduino. Actuator activated for {int(fire_dets[0].burst_ms)} ms.")
            else:
                st.code("SUPPRESS", language="text")
                st.info("Actuator stays inactive.")


# ===========================================================================
# TAB 2: REVIEW-II SIMULATION ANALYTICS & BASELINE COMPARISON
# ===========================================================================
with tab_analytics:
    st.markdown("### 📊 Review II Simulation Metrics & Baseline Comparison")
    st.caption("Quantitative outcomes across the 90-image controlled synthetic test dataset.")

    # Results table
    table_file = os.path.join(cfg.OUTPUT_DIR, "review_ii_results_table.md")
    if os.path.exists(table_file):
        with open(table_file, encoding="utf-8", errors="replace") as f:
            st.markdown(f.read())
    else:
        st.warning("Review II results table not found. Run `create_report_assets.py` to generate it.")

    st.divider()
    st.markdown("### 📈 Analytical Visualization & Comparison Plots")

    row1_c1, row1_c2 = st.columns(2)
    with row1_c1:
        p1 = os.path.join(cfg.OUTPUT_DIR, "volume_comparison.png")
        if os.path.exists(p1):
            st.image(p1, caption="Graph 1: Targeted Micro-Dose vs Blanket Spray Baseline", use_container_width=True)
    with row1_c2:
        p2 = os.path.join(cfg.OUTPUT_DIR, "confusion_matrix.png")
        if os.path.exists(p2):
            st.image(p2, caption="Graph 2: Gate Comparison - False Positive Reduction via Dual-Cue", use_container_width=True)

    row2_c1, row2_c2 = st.columns(2)
    with row2_c1:
        p3 = os.path.join(cfg.OUTPUT_DIR, "dose_distribution.png")
        if os.path.exists(p3):
            st.image(p3, caption="Graph 3: Size-Scaled Burst Duration Distribution (ms)", use_container_width=True)
    with row2_c2:
        p4 = os.path.join(cfg.OUTPUT_DIR, "detection_examples.png")
        if os.path.exists(p4):
            st.image(p4, caption="Graph 4: Detection Outcome Frequencies across Synthetic Dataset", use_container_width=True)

    p5 = os.path.join(cfg.OUTPUT_DIR, "coordinate_visualization.png")
    if os.path.exists(p5):
        st.image(p5, caption="Graph 5: Coordinate Transformation Model & Nozzle Offset Mapping", use_container_width=True)


# ===========================================================================
# TAB 3: STRUCTURED EVENT LOG
# ===========================================================================
with tab_events:
    st.markdown("### 📋 Structured Event Log (`outputs/events.csv`)")
    st.caption("Every processed candidate and frame is deterministically logged with spatial, geometric, and dosing attributes.")

    if os.path.exists(cfg.EVENTS_CSV):
        ev_df = pd.read_csv(cfg.EVENTS_CSV, encoding="utf-8", encoding_errors="replace")
        
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            decision_filter = st.selectbox("Filter by Decision:", ("ALL", "FIRE", "SUPPRESS", "NO_CANDIDATE"))
        with col_f2:
            search_query = st.text_input("Search Image Name:")

        filtered_df = ev_df.copy()
        if decision_filter != "ALL":
            filtered_df = filtered_df[filtered_df["decision"] == decision_filter]
        if search_query:
            filtered_df = filtered_df[filtered_df["image_name"].str.contains(search_query, case=False, na=False)]

        st.dataframe(filtered_df, use_container_width=True, height=450)
        
        st.download_button(
            label="📥 Download Full Event Log CSV",
            data=ev_df.to_csv(index=False).encode("utf-8"),
            file_name="events_log_simulation.csv",
            mime="text/csv"
        )
    else:
        st.info("No events log found. Run `python run_batch.py` to generate it.")


# ===========================================================================
# TAB 4: SYNTHETIC DATASET GALLERY (ALL 90 IMAGES)
# ===========================================================================
with tab_gallery:
    st.markdown("### 🖼️ Synthetic Test Dataset (90 Controlled Images)")
    st.caption("All 90 synthetic test images generated by `generate_mock_dataset.py` for algorithmic verification.")

    subtab_weed, subtab_crop, subtab_bg = st.tabs([
        "🌿 Weed Targets (35 Images)",
        "🌾 Crop Targets (35 Images)",
        "🟫 Soil Backgrounds (20 Images)"
    ])

    def render_gallery(prefix: str, count: int, columns: int = 5):
        files = [f"{prefix}_{i:04d}.png" for i in range(count)]
        existing = [f for f in files if os.path.exists(os.path.join(cfg.MOCK_IMAGE_DIR, f))]
        
        for row_start in range(0, len(existing), columns):
            cols = st.columns(columns)
            for i, col in enumerate(cols):
                idx = row_start + i
                if idx < len(existing):
                    fname = existing[idx]
                    img_path = os.path.join(cfg.MOCK_IMAGE_DIR, fname)
                    with col:
                        st.image(img_path, caption=fname, use_container_width=True)
                        if st.button(f"Inspect", key=f"btn_{fname}"):
                            st.session_state["chosen_file"] = fname
                            st.rerun()

    with subtab_weed:
        st.write("Target: Irregular green rosettes & blobs on soil. Expected outcome: **FIRE**")
        render_gallery("weed", 35, columns=5)

    with subtab_crop:
        st.write("Target: Elongated green blades & high aspect-ratio foliage. Expected outcome: **SUPPRESS**")
        render_gallery("crop", 35, columns=5)

    with subtab_bg:
        st.write("Target: Soil textures, shadows, sensor noise (no green vegetation). Expected outcome: **NO CANDIDATE**")
        render_gallery("bg", 20, columns=5)

# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------
st.divider()
st.caption(
    "BACSE291 Innovative Design Project · Team 202601383 (Akshita Parihar, Divyanshi Rai, Adarsh Agrawal) | "
    "**SIMULATION ONLY — All physical pump, coordinate, and sensor parameters are placeholders pending hardware integration.**"
)
