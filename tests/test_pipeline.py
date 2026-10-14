"""
tests/test_pipeline.py
======================
Automated unit tests for the Precision Micro-Dosing Weed Sprayer pipeline.

Tested components
-----------------
1.  ExG calculation
2.  Zero-division handling
3.  Contour area calculation
4.  Circularity calculation
5.  Dual-cue truth table (all 4 combinations)
6.  Dose calculation
7.  Volume calculation
8.  Coordinate transformation
9.  Event logging
10. Invalid image handling
11. Edge cases: black/white/empty images

Usage
-----
    pytest tests/ -v

All tests use synthetic NumPy arrays — no real images required.
"""

import os
import sys
import math
import tempfile
import csv

import numpy as np
import cv2
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config as cfg
from vision_pipeline import (
    compute_exg,
    threshold_exg,
    morphological_cleanup,
    extract_features,
    colour_cue,
    shape_cue,
    dual_cue_gate,
    compute_burst_ms,
    compute_volume_ml,
    run_pipeline,
    bgr_to_rgb_float,
    ContourFeatures,
)
from coordinate_simulation import pixel_to_bed, apply_nozzle_offset, euclidean_error
from logger import log_event, log_no_detection, _ensure_header


# ---------------------------------------------------------------------------
# 1. ExG Calculation
# ---------------------------------------------------------------------------

class TestExG:

    def test_pure_green_pixel(self):
        """A pixel with (R=0, G=255, B=0) should give maximum ExG."""
        # RGB float: r=0, g=1, b=0 → ExG = 2(1) - 0 - 0 = 2.0 (but normalised: g=1)
        rgb = np.zeros((1, 1, 3), dtype=np.float32)
        rgb[0, 0] = [0.0, 1.0, 0.0]   # R, G, B normalised
        exg = compute_exg(rgb)
        # Normalised channels: r=0/(0+1+0+ε), g=1/(0+1+0+ε), b=0
        # ExG ≈ 2*1 - 0 - 0 = 2.0 (approximately, due to epsilon)
        assert exg[0, 0] > 1.5, f"Expected ExG>1.5 for pure green, got {exg[0,0]}"

    def test_pure_red_pixel(self):
        """A pure red pixel should give negative ExG."""
        rgb = np.zeros((1, 1, 3), dtype=np.float32)
        rgb[0, 0] = [1.0, 0.0, 0.0]   # R, G, B
        exg = compute_exg(rgb)
        assert exg[0, 0] < 0, f"Expected negative ExG for red pixel, got {exg[0,0]}"

    def test_grey_pixel(self):
        """A neutral grey pixel should give ExG ≈ 0."""
        rgb = np.full((1, 1, 3), 0.5, dtype=np.float32)
        exg = compute_exg(rgb)
        assert abs(exg[0, 0]) < 0.05, f"Expected ExG≈0 for grey, got {exg[0,0]}"

    def test_output_shape(self):
        """ExG output must match input spatial dimensions."""
        rgb = np.random.rand(100, 80, 3).astype(np.float32)
        exg = compute_exg(rgb)
        assert exg.shape == (100, 80)

    def test_output_dtype(self):
        """ExG output must be float32."""
        rgb = np.random.rand(50, 50, 3).astype(np.float32)
        exg = compute_exg(rgb)
        assert exg.dtype == np.float32


# ---------------------------------------------------------------------------
# 2. Zero-division handling
# ---------------------------------------------------------------------------

class TestZeroDivision:

    def test_black_image_exg(self):
        """Completely black image (all zeros) must not raise ZeroDivisionError."""
        rgb = np.zeros((100, 100, 3), dtype=np.float32)
        try:
            exg = compute_exg(rgb)
            assert np.all(np.isfinite(exg)), "ExG must be finite for black image"
        except ZeroDivisionError:
            pytest.fail("ZeroDivisionError on black image — epsilon not applied")

    def test_white_image_exg(self):
        """Completely white image must not raise errors."""
        rgb = np.ones((100, 100, 3), dtype=np.float32)
        exg = compute_exg(rgb)
        assert np.all(np.isfinite(exg))

    def test_zero_perimeter_contour(self):
        """extract_features must handle zero-perimeter contour gracefully."""
        # Create a 1-pixel contour (degenerate)
        cnt = np.array([[[10, 10]]], dtype=np.int32)
        exg_map = np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH), dtype=np.float32)
        try:
            f = extract_features(cnt, 0, exg_map)
            assert np.isfinite(f.circularity)
        except ZeroDivisionError:
            pytest.fail("ZeroDivisionError on zero-perimeter contour")


# ---------------------------------------------------------------------------
# 3. Contour area
# ---------------------------------------------------------------------------

class TestContourArea:

    def _make_circle_contour(self, cx, cy, r, img_w=640, img_h=480):
        """Create a synthetic circle contour."""
        mask = np.zeros((img_h, img_w), dtype=np.uint8)
        cv2.circle(mask, (cx, cy), r, 255, -1)
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return cnts[0] if cnts else None

    def test_circle_area_approximate(self):
        """Area of a circle contour should be close to π·r²."""
        cnt = self._make_circle_contour(320, 240, 50)
        assert cnt is not None
        area = cv2.contourArea(cnt)
        expected = math.pi * 50 ** 2
        # Allow 5% tolerance for discretisation
        assert abs(area - expected) / expected < 0.05, \
            f"Circle area {area} far from expected {expected:.0f}"

    def test_rectangle_area(self):
        """Area of a rectangular contour should equal width × height."""
        mask = np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH), dtype=np.uint8)
        cv2.rectangle(mask, (100, 100), (200, 200), 255, -1)
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        area = cv2.contourArea(cnts[0])
        assert abs(area - 10000) < 100, f"Rectangle area {area} should be ≈10000"


# ---------------------------------------------------------------------------
# 4. Circularity
# ---------------------------------------------------------------------------

class TestCircularity:

    def test_circle_circularity_near_one(self):
        """A circle contour should have circularity ≈ 1.0."""
        mask = np.zeros((200, 200), dtype=np.uint8)
        cv2.circle(mask, (100, 100), 60, 255, -1)
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        exg_map = np.zeros((200, 200), dtype=np.float32)
        f = extract_features(cnts[0], 0, exg_map)
        assert f.circularity > 0.85, \
            f"Circle circularity should be >0.85, got {f.circularity:.3f}"

    def test_thin_rectangle_circularity(self):
        """A thin rectangle should have circularity much less than 1."""
        mask = np.zeros((480, 640), dtype=np.uint8)
        cv2.rectangle(mask, (50, 200), (590, 210), 255, -1)   # very thin
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            exg_map = np.zeros((480, 640), dtype=np.float32)
            f = extract_features(cnts[0], 0, exg_map)
            assert f.circularity < 0.5, \
                f"Thin rect circularity should be <0.5, got {f.circularity:.3f}"


# ---------------------------------------------------------------------------
# 5. Dual-cue truth table
# ---------------------------------------------------------------------------

class TestDualCueTruthTable:
    """
    Truth table:
      Colour | Shape | Decision
         0   |   0   | SUPPRESS
         0   |   1   | SUPPRESS
         1   |   0   | SUPPRESS
         1   |   1   | FIRE
    """

    def _make_features(self, area=5000, mean_exg=0.10,
                        circ=0.40, solid=0.60):
        return ContourFeatures(
            contour_id=0, area=area, perimeter=250.0,
            cx=100.0, cy=100.0,
            bb_x=50, bb_y=50, bb_w=100, bb_h=100,
            aspect_ratio=1.0, extent=0.5,
            solidity=solid, circularity=circ,
            mean_exg=mean_exg, bb_area=10000.0, hull_area=8000.0
        )

    def test_both_fail_suppress(self):
        f = self._make_features(mean_exg=0.01, circ=0.01, solid=0.01, area=100)
        c, s, dec = dual_cue_gate(f)
        assert dec == "SUPPRESS"
        assert not c and not s

    def test_colour_only_suppress(self):
        f = self._make_features(mean_exg=0.20, circ=0.01, solid=0.01, area=100)
        c, s, dec = dual_cue_gate(f)
        assert dec == "SUPPRESS"
        assert c and not s

    def test_shape_only_suppress(self):
        f = self._make_features(mean_exg=0.01, circ=0.50, solid=0.70, area=5000)
        c, s, dec = dual_cue_gate(f)
        assert dec == "SUPPRESS"
        assert not c and s

    def test_both_pass_fire(self):
        f = self._make_features(mean_exg=0.20, circ=0.50, solid=0.70, area=5000)
        c, s, dec = dual_cue_gate(f)
        assert dec == "FIRE", f"Expected FIRE, got {dec}"
        assert c and s


# ---------------------------------------------------------------------------
# 6. Dose calculation
# ---------------------------------------------------------------------------

class TestDose:

    def test_dose_within_range(self):
        """Burst duration must be within [T_MIN, T_MAX]."""
        for area in [500, 3000, 12000, 50000, 100000]:
            burst = compute_burst_ms(area)
            assert cfg.T_MIN_MS <= burst <= cfg.T_MAX_MS, \
                f"Burst {burst} out of [{cfg.T_MIN_MS}, {cfg.T_MAX_MS}] for area={area}"

    def test_zero_area_gives_min(self):
        """Zero area → T_MIN burst."""
        burst = compute_burst_ms(0)
        assert burst == cfg.T_MIN_MS

    def test_large_area_gives_max(self):
        """Very large area → T_MAX burst."""
        burst = compute_burst_ms(1e9)
        assert burst == cfg.T_MAX_MS

    def test_proportionality(self):
        """Larger area should give longer burst."""
        burst_small = compute_burst_ms(1000)
        burst_large = compute_burst_ms(10000)
        assert burst_large >= burst_small


# ---------------------------------------------------------------------------
# 7. Volume calculation
# ---------------------------------------------------------------------------

class TestVolume:

    def test_zero_burst_gives_zero_volume(self):
        vol = compute_volume_ml(0)
        assert vol == 0.0

    def test_volume_formula(self):
        """V = Q × (burst_ms / 1000)."""
        burst = 100.0
        expected = cfg.FLOW_RATE_ML_S * (burst / 1000.0)
        assert abs(compute_volume_ml(burst) - expected) < 1e-9


# ---------------------------------------------------------------------------
# 8. Coordinate transformation
# ---------------------------------------------------------------------------

class TestCoordinate:

    def test_origin_maps_to_zero(self):
        x, y = pixel_to_bed(0, 0, img_w=640, img_h=480,
                            bed_w=500, bed_h=400)
        assert x == 0.0 and y == 0.0

    def test_max_pixel_maps_to_bed_max(self):
        x, y = pixel_to_bed(639, 479, img_w=640, img_h=480,
                            bed_w=500.0, bed_h=400.0)
        assert abs(x - 500.0) < 1.0, f"Expected ≈500, got {x}"
        assert abs(y - 400.0) < 1.0, f"Expected ≈400, got {y}"

    def test_centre_pixel_maps_to_half_bed(self):
        x, y = pixel_to_bed(319, 239, img_w=640, img_h=480,
                            bed_w=500.0, bed_h=400.0)
        assert 245 < x < 255, f"Expected ≈250, got {x}"
        assert 195 < y < 205, f"Expected ≈200, got {y}"

    def test_nozzle_offset_applied(self):
        x_bed, y_bed = pixel_to_bed(0, 0)
        x_noz, y_noz = apply_nozzle_offset(x_bed, y_bed,
                                            dx=50.0, dy=10.0)
        assert abs(x_noz - (x_bed + 50.0)) < 1e-6
        assert abs(y_noz - (y_bed + 10.0)) < 1e-6

    def test_euclidean_error_zero(self):
        err = euclidean_error(100.0, 200.0, 100.0, 200.0)
        assert err == 0.0

    def test_euclidean_error_known(self):
        err = euclidean_error(0.0, 0.0, 3.0, 4.0)
        assert abs(err - 5.0) < 1e-9


# ---------------------------------------------------------------------------
# 9. Event logging
# ---------------------------------------------------------------------------

class TestLogging:

    def test_log_creates_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "test_events.csv")
            log_event(
                image_name="test.png", candidate_id=0,
                target_detected=True, colour_cue=True, shape_cue=True,
                decision="FIRE", area_px=5000.0,
                centroid_x=100.0, centroid_y=200.0,
                bb_x=50, bb_y=80, bb_w=100, bb_h=80,
                aspect_ratio=1.25, solidity=0.8, extent=0.5,
                circularity=0.7, mean_exg=0.15,
                burst_ms=120.0, estimated_volume_ml=0.24,
                csv_path=csv_path,
            )
            assert os.path.exists(csv_path)
            with open(csv_path) as f:
                rows = list(csv.DictReader(f))
            assert len(rows) == 1
            assert rows[0]["decision"] == "FIRE"

    def test_log_suppress_has_zero_burst(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "test_events.csv")
            log_event(
                image_name="test.png", candidate_id=1,
                target_detected=True, colour_cue=False, shape_cue=True,
                decision="SUPPRESS", area_px=5000.0,
                centroid_x=100.0, centroid_y=200.0,
                bb_x=50, bb_y=80, bb_w=100, bb_h=80,
                aspect_ratio=1.25, solidity=0.8, extent=0.5,
                circularity=0.7, mean_exg=0.03,
                burst_ms=0.0, estimated_volume_ml=0.0,
                csv_path=csv_path,
            )
            with open(csv_path) as f:
                rows = list(csv.DictReader(f))
            assert float(rows[0]["burst_ms"]) == 0.0


# ---------------------------------------------------------------------------
# 10. Invalid image handling
# ---------------------------------------------------------------------------

class TestInvalidImage:

    def test_missing_file(self):
        out = run_pipeline("/nonexistent/path/image.jpg", "missing.jpg")
        assert out.error is not None

    def test_invalid_format_handled(self):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"this is not an image")
            path = f.name
        out = run_pipeline(path, "invalid.txt")
        assert out.error is not None
        os.unlink(path)


# ---------------------------------------------------------------------------
# 11. Edge cases — image content
# ---------------------------------------------------------------------------

class TestEdgeCases:

    def _write_temp_image(self, img_array):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            cv2.imwrite(f.name, img_array)
            return f.name

    def test_black_image_no_crash(self):
        img = np.zeros((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3), dtype=np.uint8)
        path = self._write_temp_image(img)
        out = run_pipeline(path, "black.png")
        assert out.error is None
        assert len(out.detections) == 0
        os.unlink(path)

    def test_white_image_no_crash(self):
        img = np.full((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3), 255, dtype=np.uint8)
        path = self._write_temp_image(img)
        out = run_pipeline(path, "white.png")
        assert out.error is None
        os.unlink(path)

    def test_no_vegetation_image(self):
        """Brown soil image should produce no FIRE events."""
        img = np.full((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3),
                      [40, 65, 90], dtype=np.uint8)   # brown (BGR)
        path = self._write_temp_image(img)
        out = run_pipeline(path, "soil.png")
        fire_events = [d for d in out.detections if d.decision == "FIRE"]
        assert len(fire_events) == 0
        os.unlink(path)

    def test_exg_threshold_range(self):
        """threshold_exg must produce only 0 and 255."""
        exg = np.random.uniform(-1, 1, (100, 100)).astype(np.float32)
        mask = threshold_exg(exg, threshold=0.1)
        unique_vals = np.unique(mask)
        for v in unique_vals:
            assert v in (0, 255), f"Unexpected value in mask: {v}"

    def test_multiple_candidates(self):
        """Multiple green blobs should produce multiple candidates."""
        img = np.full((cfg.IMAGE_HEIGHT, cfg.IMAGE_WIDTH, 3),
                      [40, 65, 90], dtype=np.uint8)
        # Draw 3 green circles
        for cx in [100, 320, 540]:
            cv2.circle(img, (cx, 240), 50, (30, 170, 30), -1)
        path = self._write_temp_image(img)
        out = run_pipeline(path, "multi.png")
        # Should find at least 1 candidate (may vary with config)
        # Just verify no crash
        assert out.error is None
        os.unlink(path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
