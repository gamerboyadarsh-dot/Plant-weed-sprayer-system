# PANEL Q&A — Expected Questions and Model Answers
## BACSE291 IDP Review II — Precision Micro-Dosing Weed Sprayer

> Prepare these answers. Speak confidently but honestly.
> Do not overclaim. Acknowledge all assumptions clearly.

---

**Q1. Why did you choose ExG (Excess Green Index)?**

ExG is a classical, computationally lightweight vegetation index that emphasises green-biased pixels without requiring training data or a GPU. It is appropriate for our initial proof-of-concept stage. The formula `ExG = 2g − r − b` using normalised channels is simple to implement, explain, and tune. It is widely used in agricultural image analysis literature.

---

**Q2. Why not use YOLO or a deep learning model?**

At 20% project completion, we do not yet have labelled real agricultural training data, GPU resources, or a validated dataset. A classical approach is more appropriate for an initial proof-of-concept — it is explainable, requires no training, runs on CPU, and can be demonstrated transparently. A lightweight model such as MobileNet-SSD or YOLO-nano is noted as a possible future upgrade once real data is collected.

---

**Q3. What is the dual-cue confirmation gate?**

The dual-cue gate requires a candidate to satisfy TWO independent conditions before a spray command is issued:
1. **Colour cue**: mean ExG inside the contour ≥ threshold (vegetation confirmed)
2. **Shape cue**: contour area, solidity, and circularity within valid ranges

Only when BOTH pass does the system output FIRE. If either fails, the output is SUPPRESS. This reduces false positives from non-weed green objects.

---

**Q4. How does the shape detection work?**

After vegetation masking, OpenCV's `findContours` extracts connected regions. For each contour we compute area, perimeter, solidity (area/convex hull area), circularity (4πA/P²), and aspect ratio. We then apply configurable geometric filters. A weed-like blob typically has high solidity and circularity; a crop row or elongated leaf has low circularity and high aspect ratio — allowing discrimination in many cases.

---

**Q5. Why use Raspberry Pi for vision and Arduino/ESP32 for actuation?**

Raspberry Pi provides a full Linux environment with Python, OpenCV, and high-level processing capability, but is NOT a real-time system — its OS scheduler can introduce timing jitter. Arduino/ESP32 provides deterministic real-time control for precise millisecond-level pulse timing for the solenoid valve. Separating vision (Pi) from actuation (Arduino) is a standard embedded system design pattern.

---

**Q6. Why not control the pump directly from Raspberry Pi?**

The Raspberry Pi GPIO does not provide guaranteed real-time timing. A 120 ms spray burst controlled by Pi software could have ±10-50 ms jitter depending on OS load. Arduino's `delay()` or hardware timer interrupts provide deterministic timing at the sub-millisecond level — critical for consistent dosing.

---

**Q7. How is burst duration calculated?**

```
T_burst = clip( T_min + (A / A_ref) × (T_max − T_min), T_min, T_max )
```
Where A is the detected target area in pixels, A_ref is a reference area, and T_min/T_max are bounds. Larger targets receive longer bursts, proportionally. All constants are simulation assumptions pending hardware calibration.

---

**Q8. How is flow rate obtained?**

Currently it is a **simulation assumption** (2.0 mL/s). Physical flow rate has NOT been measured. After selecting and purchasing a pump, we will measure it experimentally: record volume dispensed into a graduated cylinder over a fixed time interval. This is a future hardware integration task.

---

**Q9. Why is the current flow rate only an assumption?**

No pump has been purchased or tested yet. The value 2.0 mL/s is a placeholder that allows the software simulation to demonstrate the volume calculation formula. It will be replaced with a measured value during the hardware integration phase.

---

**Q10. How will physical calibration be performed?**

For flow rate: timed pump test with graduated cylinder.  
For camera-to-nozzle offset: measure physical distance after assembly.  
For coordinate mapping: place reference markers at known positions on the test bed, detect them with the camera, and compute a homography matrix.  
For burst constants: test with water on a known target area, measure actual coverage, adjust T_min/T_max accordingly.

---

**Q11. What happens under changing lighting conditions?**

ExG is relatively robust to moderate lighting changes because it uses normalised channel ratios rather than absolute brightness. However, extreme shadows, direct sunlight saturation, or coloured artificial lighting can cause incorrect segmentation. This is a known limitation. Future work includes adaptive threshold tuning or time-of-day calibration.

---

**Q12. What happens when weed and crop have similar colours (green-on-green)?**

This is the **green-on-green challenge** — the primary limitation of colour-only vegetation detection. ExG cannot distinguish between two different green plants. The shape cue partially helps (crop rows are elongated, weed rosettes are circular), but it is not sufficient in all cases. ML-based classification is noted as a future upgrade to address this.

---

**Q13. What is green-on-green detection?**

Green-on-green refers to the problem of detecting green weed targets against a green crop background. Since both plant types have positive ExG values, simple colour thresholding fails. This requires either spectral information beyond visible RGB (e.g., NIR cameras), texture analysis, or a trained classifier.

---

**Q14. What are false positives (FP)?**

A false positive occurs when the system issues a FIRE command for a target that is NOT a weed (e.g., a crop plant or a green equipment label). False positives waste herbicide and can damage crops. The dual-cue gate is designed to reduce FP rate compared to colour-only detection.

---

**Q15. What are false negatives (FN)?**

A false negative occurs when the system outputs SUPPRESS for a region that IS a weed. False negatives mean weeds are not treated. There is a trade-off: tightening parameters to reduce FP may increase FN.

---

**Q16. How will precision and recall be measured?**

On the synthetic dataset we already compute TP, TN, FP, FN from the ground-truth labels CSV. On real data (future phase), we will manually label a test set and compare pipeline outputs against ground truth.

---

**Q17. How will aim error be measured?**

In the current simulation, aim error is modelled as Gaussian noise (σ = 5 mm). Physically, we will place a paper target at a known bed coordinate, fire a water burst, and measure the landing point distance from the centre. This is pending hardware integration.

---

**Q18. What is the camera-to-nozzle offset?**

When the camera detects a target at pixel (u, v), the nozzle is not located at the camera — it is mechanically offset. The offset vector (Δx, Δy) must be added to convert the detected position to the nozzle aim point. Currently Δx = 50 mm, Δy = 0 mm are **simulation assumptions**.

---

**Q19. How will perspective distortion be handled?**

The current linear model assumes a perfect top-down camera. Real cameras introduce perspective distortion — objects at the image edges appear shifted. We will use OpenCV's `getPerspectiveTransform` and `warpPerspective` with four reference points to compute a homography correction. This is documented as a future task.

---

**Q20. Why a dual-controller architecture (Pi + Arduino)?**

Separation of concerns: high-level vision on Pi (Python/OpenCV), deterministic actuation on Arduino (C/hardware timers). This is also scalable — future upgrades to the vision algorithm only require changing Pi-side code, without touching the actuator controller.

---

**Q21. What is the role of the solenoid valve?**

The solenoid valve is an electrically controlled on/off valve. When energised, it opens and allows pump pressure to push liquid through the nozzle. When de-energised, it closes. Burst duration = solenoid ON time = time over which liquid flows.

---

**Q22. Why use a MOSFET/relay?**

Arduino GPIO pins can only source ~40 mA. A solenoid valve typically requires 0.5–2 A. A MOSFET or relay acts as a switch: the Arduino controls the gate/coil with a small signal current, and the MOSFET/relay switches the high-current solenoid circuit separately.

---

**Q23. What is the purpose of the Wokwi simulation?**

Wokwi validates the **Arduino serial command parsing and timing logic** — confirming that the Arduino correctly receives `FIRE 120\n`, activates the virtual actuator for exactly 120 ms, then deactivates. It does NOT simulate fluid mechanics. It is a software protocol validation tool.

---

**Q24. What are the current limitations?**

1. Synthetic dataset only — no real agricultural images tested  
2. No physical hardware constructed or tested  
3. Flow rate, nozzle offset, and dosing constants are simulation assumptions  
4. Green-on-green detection not addressed  
5. No temporal tracking between frames  
6. No perspective calibration  
7. No spray plume or landing point model  

---

**Q25. What will be done after Review II?**

Phase 2: Pump bench calibration  
Phase 3: Arduino actuator control with solenoid  
Phase 4: Raspberry Pi → Arduino serial communication  
Phase 5: Camera mount and physical coordinate calibration  
Phase 6: Physical test-bed construction  
Phase 7: Water spray landing validation  
Phase 8: End-to-end integration and optimisation  

---

**Q26. What is the project's technical novelty?**

Proposed project-level differentiators (not claimed as globally novel):
1. **Size-scaled dosing** — proportional burst duration based on weed pixel area
2. **Dual-cue confirmation** — requiring both colour AND shape match
3. **Low-cost tabletop implementation** — Pi + Arduino + off-the-shelf components
4. **Reproducible test-bed methodology** — controlled synthetic benchmark

We do not claim the concept of camera-guided spraying is novel. Selective spraying systems exist commercially. Our differentiation is in the implementation approach and low-cost accessibility.

---

**Q27. What is the approximate Bill of Materials cost?**

| Component | Estimated Cost |
|-----------|---------------|
| Raspberry Pi 4 | ₹4,000–6,000 |
| Arduino Uno/Nano | ₹300–800 |
| USB Camera | ₹500–1,500 |
| 12V Solenoid Valve | ₹300–600 |
| 12V Peristaltic Pump | ₹500–1,000 |
| MOSFET / Relay module | ₹50–150 |
| Power supply | ₹300–600 |
| Frame / test bed | ₹500–1,500 |
| **Total (estimated)** | **₹6,450–12,150** |

_Prices are rough estimates — subject to vendor and availability._

---

**Q28. How will liquid savings ultimately be measured?**

Using a known test-bed area with controlled target positions:
1. Run precision spray over the test bed — collect and weigh dispensed liquid
2. Run full blanket spray over same area — collect and weigh dispensed liquid
3. Compare

This requires the physical hardware (Phases 2–8) to be complete.

---

**Q29. Why is the current result not considered field validation?**

The current results are computed on a **synthetic software dataset** with **assumed parameters**. Real agricultural performance depends on: actual weed density and species, real lighting conditions, physical pump behaviour, mechanical precision of the nozzle mount, and actual flow rate. None of these have been measured. All current numbers are therefore simulation-only.

---

**Q30. What does approximately 20% completion mean?**

At Review II, we have demonstrated:
- Requirement analysis ✅
- System architecture design ✅
- Technology/component selection ✅
- Initial software prototype: vision pipeline, dual-cue gate, dosing, coordinate model, event logging, dashboard ✅
- Simulation methodology and validation plan ✅
- Documentation ✅

Hardware construction, physical calibration, field testing, and optimisation remain as future phases. We are at approximately 20% of the total project scope.
