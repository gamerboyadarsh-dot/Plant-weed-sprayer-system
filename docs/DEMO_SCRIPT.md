# DEMO SCRIPT — 5-Minute Live Demonstration
## BACSE291 Review II — Precision Micro-Dosing Weed Sprayer

---

## Pre-Demo Setup Checklist

- [ ] Dashboard running: `streamlit run dashboard.py`
- [ ] Browser open at http://localhost:8501
- [ ] 3 demo images ready in `data/mock_images/`
- [ ] `outputs/events.csv` populated (run `run_batch.py` first)
- [ ] All graphs generated (`create_report_assets.py`)
- [ ] Wokwi project open in second browser tab

---

## SEGMENT 1: Problem (0:00–0:30)

**Say**:
"The goal of our project is to reduce herbicide waste in small-farm weed control. Conventional blanket spraying applies chemical uniformly over the entire bed, even though weeds occupy only a fraction of the total area. Our system uses a camera to detect individual weed targets and spray only those locations — theoretically reducing chemical use significantly."

"At this stage of the project — approximately 20% completion — we have built a complete software simulation of the detection and dosing pipeline, which I will now demonstrate."

---

## SEGMENT 2: Architecture (0:30–1:00)

**Point to the architecture diagram on slide 6 or README**:

"The pipeline has 12 stages: image input, ExG computation, vegetation masking, morphological cleanup, contour extraction, feature computation, dual-cue confirmation, dosing, coordinate transformation, event logging, and the dashboard you see here."

"All stages are classical OpenCV — no deep learning — making the system explainable and lightweight."

---

## SEGMENT 3: Vision Pipeline Demo (1:00–2:00)

**Switch to Dashboard — upload weed_0001.png**

"I'll upload a synthetic test image. This image is programmatically generated — it is a simulation test object, not a real agricultural image."

*Wait for pipeline to run.*

"Section 1 shows the original image. Section 2 shows the Excess Green Index heatmap — green regions have high ExG values, soil has low values. The binary mask isolates candidate vegetation regions after thresholding and morphological cleanup."

"The annotated image shows detected contours with bounding boxes, centroids, and computed features: area, mean ExG, circularity, and solidity."

---

## SEGMENT 4: Dual-Cue Decision (2:00–2:30)

**Point to Section 4 in Dashboard**

"Section 4 shows the dual-cue decision. The system requires BOTH the colour cue AND the shape cue to pass before issuing a FIRE command. If either fails, the output is SUPPRESS."

"For this target: colour cue PASS — mean ExG is 0.18, above threshold. Shape cue PASS — circularity and solidity within range. Decision: FIRE."

*Now upload crop_0001.png*

"For this crop-like elongated target: colour cue may pass — it is green. But shape cue FAILS — high aspect ratio, low circularity indicates an elongated blade. Decision: SUPPRESS. This demonstrates the advantage of the dual-cue over colour-only detection."

---

## SEGMENT 5: Dose Calculation (2:30–3:00)

**Point to Section 5 in Dashboard**

"For FIRE events, the system computes a size-scaled burst duration using the formula:"

`T = clip( T_min + (A / A_ref) × (T_max − T_min),  T_min,  T_max )`

"For this target with area X px², the burst is Y ms. The estimated volume is Z mL, computed using an assumed flow rate of 2.0 mL/s."

"I want to emphasise: the flow rate is a SIMULATION ASSUMPTION. Physical pump calibration is a future task."

---

## SEGMENT 6: Volume Comparison (3:00–3:30)

**Point to the volume_comparison.png graph**

"This graph shows the theoretical targeted volume versus the blanket-spray baseline for the full 90-image batch."

"Targeted: X.X mL. Blanket baseline: Y.Y mL. Theoretical reduction: Z%."

"These are computed from software simulation parameters — not physical spray measurements. The real savings will depend on actual pump calibration and field conditions."

---

## SEGMENT 7: Coordinate Transformation (3:30–4:00)

**Point to Section 6 in Dashboard**

"Section 6 shows the coordinate transformation. The detected pixel centroid is converted to physical test-bed coordinates using a linear top-down model. The camera-to-nozzle offset is then applied to give the nozzle aim point."

"Currently Δx = 50 mm — a simulation assumption. Physical offset will be measured after hardware assembly."

**Show coordinate_visualization.png**

"This scatter plot shows how pixel positions map to bed coordinates, and how the nozzle offset shifts the aim point."

---

## SEGMENT 8: Event Log (4:00–4:30)

**Point to Section 7 in Dashboard**

"Every processed image generates a structured event row logged to events.csv. Columns include: timestamp, image name, candidate features, colour/shape cue, decision, burst duration, estimated volume, and bed coordinates."

"This provides full traceability from image input to spray command — useful for debugging and future validation."

---

## SEGMENT 9: Wokwi Simulation and Next Steps (4:30–5:00)

**Switch to Wokwi tab**

"Section 9 of the dashboard shows the simulated Arduino serial output: 'FIRE 120'. In the Wokwi simulation, the Arduino receives this command, activates the virtual actuator (LED on pin 13) for exactly 120 ms, then deactivates and prints a status confirmation."

"This validates the serial command parsing and timing logic — not fluid mechanics."

"Our next steps are: pump bench calibration, Arduino solenoid control, Raspberry Pi-to-Arduino serial link, camera calibration, and physical test-bed construction."

"Thank you. Happy to take questions."

---

## Backup Demo Images

| Image | Expected Decision | Use Case |
|-------|-------------------|---------|
| weed_0001.png | FIRE | Case 1: Clear weed detection |
| crop_0001.png | SUPPRESS | Case 2: Crop-like shape rejected |
| bg_0001.png | NO CANDIDATE | Case 3: Background — no detection |
