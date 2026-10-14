# ASSUMPTIONS AND LIMITATIONS
## Precision Micro-Dosing Weed Sprayer — BACSE291 IDP

> ⚠️ This document explicitly lists every assumption and limitation
> in the current software proof-of-concept.
> Transparency about assumptions is a scientific and engineering requirement.

---

## SIMULATION ASSUMPTIONS

### A1 — Flow Rate
- **Value**: 2.0 mL/s
- **Status**: SIMULATION ASSUMPTION
- **Reason**: No physical pump has been selected, purchased, or calibrated.
- **Future action**: Measure actual pump flow rate on a bench using a graduated cylinder and stopwatch.

### A2 — Burst Duration Constants (T_min, T_max, A_ref)
- **Values**: T_min = 80 ms, T_max = 320 ms, A_ref = 12,000 px²
- **Status**: SIMULATION ASSUMPTION
- **Reason**: These are initial placeholder values for the dosing formula.
- **Future action**: Calibrate using actual target sizes on the physical test bed.

### A3 — Virtual Frame Time (Blanket Baseline)
- **Value**: 0.5 s per frame
- **Status**: SIMULATION ASSUMPTION
- **Reason**: No physical test-bed travel speed has been defined.
- **Future action**: Replace with `T_pass = distance / speed` using actual gantry or rover speed.

### A4 — Bed Dimensions
- **Value**: 500 × 400 mm
- **Status**: SIMULATION ASSUMPTION
- **Reason**: Physical test bed has not been constructed.
- **Future action**: Measure actual constructed test-bed dimensions.

### A5 — Camera-to-Nozzle Offset
- **Value**: Δx = 50 mm, Δy = 0 mm
- **Status**: SIMULATION ASSUMPTION
- **Reason**: No physical camera/nozzle mount has been built.
- **Future action**: Measure physical offset after mechanical assembly.

### A6 — Pixel-to-mm Scale
- **Model**: Linear top-down (nadir) mapping
- **Status**: SIMULATION ASSUMPTION
- **Reason**: Assumes perfect overhead camera. Real cameras have lens distortion and perspective effects.
- **Future action**: Use four-corner homography calibration.

### A7 — Aim Error Noise
- **Value**: Gaussian σ = 5 mm
- **Status**: SIMULATION ASSUMPTION
- **Reason**: No physical aim accuracy has been measured.
- **Future action**: Measure spray landing point on test bed.

### A8 — ExG Threshold and Geometry Thresholds
- **Status**: INITIAL PROOF-OF-CONCEPT PARAMETERS
- **Reason**: Set empirically for the synthetic dataset.
- **Future action**: Optimise using real agricultural imagery.

### A9 — Synthetic Dataset
- **Status**: SYNTHETIC SOFTWARE TEST OBJECTS ONLY
- **Reason**: No real agricultural images are available at this stage.
- **Future action**: Collect real field imagery and re-validate.

---

## LIMITATIONS

### L1 — Synthetic Dataset
The 90-image dataset consists of programmatically generated blobs.
It does NOT represent real agricultural weed/crop visual diversity.
All precision/recall metrics are therefore SIMULATION metrics only.

### L2 — No Physical Hardware
No pump, nozzle, solenoid, camera, or Raspberry Pi/Arduino has been
connected or tested. The system is 100% software simulation.

### L3 — Green-on-Green Challenge
The ExG approach performs poorly when weeds and crops share similar
green colour (e.g., grass weeds in grass crops). This is a known
limitation of colour-only vegetation detection.

### L4 — Lighting Variation
The synthetic dataset includes basic brightness/shadow variation,
but real outdoor illumination (sun angle, cloud cover, shadows from
neighbouring plants) is far more complex.

### L5 — Single-Frame Processing
No temporal tracking between video frames. A weed detected in
frame N is treated independently from frames N−1 and N+1.

### L6 — No Perspective Calibration
The linear top-down coordinate model is only valid for a camera
mounted exactly overhead. Any camera tilt introduces position error.

### L7 — No Spray Plume Model
No simulation of droplet spread, drift, or coverage radius.
The "theoretical volume" is purely a timing × flow calculation.

### L8 — No Herbicide Testing
No actual herbicide is involved or recommended during development.

### L9 — No Field Validation
No claim is made that this system would perform to the simulated
metrics in a real agricultural field. Field validation is a future phase.

### L10 — Flow Rate Not Measured
The 2.0 mL/s flow rate is a placeholder.
Physical pump calibration is a future hardware integration task.

---

## WHAT CAN BE CLAIMED AT THIS STAGE

✅ The software pipeline correctly implements the ExG algorithm  
✅ The dual-cue gate correctly implements the truth table  
✅ The dosing formula correctly applies the size-scaling rule  
✅ The coordinate transform correctly applies the linear mapping  
✅ The event logger correctly records all pipeline outputs  
✅ The dashboard correctly displays all pipeline stages  
✅ All unit tests pass on synthetic inputs  

❌ Cannot claim field accuracy  
❌ Cannot claim measured pump flow rate  
❌ Cannot claim hardware has been built or tested  
❌ Cannot claim the synthetic results represent real agricultural performance  
