"""
config.py
=========
Central configuration for the Precision Micro-Dosing Weed Sprayer simulation.

All tunable parameters are stored here so that any team member can adjust
the system behaviour without touching algorithm code.

IMPORTANT: Values marked [SIMULATION ASSUMPTION] are placeholder values
chosen for software demonstration purposes. They have NOT been measured
on physical hardware. Physical calibration is a future integration task.
"""

# ---------------------------------------------------------------------------
# IMAGE PROCESSING
# ---------------------------------------------------------------------------
IMAGE_WIDTH   = 640   # pixels - resize target width
IMAGE_HEIGHT  = 480   # pixels - resize target height

# Gaussian blur kernel size (must be odd; 0 = disabled)
BLUR_KERNEL_SIZE = 5  # [SIMULATION ASSUMPTION]

# ---------------------------------------------------------------------------
# EXCESS GREEN INDEX THRESHOLDING
# ---------------------------------------------------------------------------
# ExG = 2g - r - b  (normalised channels)
# Values above this threshold are labelled as vegetation
EXG_THRESHOLD = 0.05  # [SIMULATION ASSUMPTION] - tune for real imagery

# ---------------------------------------------------------------------------
# MORPHOLOGICAL CLEANUP
# ---------------------------------------------------------------------------
MORPH_KERNEL_SIZE  = 7   # kernel size for opening/closing (must be odd)
MORPH_OPEN_ITER    = 2   # morphological opening iterations (removes noise)
MORPH_CLOSE_ITER   = 2   # morphological closing iterations (fills holes)
MIN_BLOB_AREA      = 200 # px2 - connected regions smaller than this are dropped

# ---------------------------------------------------------------------------
# CONTOUR FILTERING - CANDIDATE SELECTION
# ---------------------------------------------------------------------------
# A contour becomes a candidate only when ALL filters pass.
# These are INITIAL PROOF-OF-CONCEPT thresholds - not validated field values.

MIN_CONTOUR_AREA   = 500     # px2   - ignore tiny noise regions
MAX_CONTOUR_AREA   = 80000   # px2   - ignore full-frame blobs

MIN_SOLIDITY       = 0.40    # dimensionless [0,1]  - convexity measure
MIN_EXTENT         = 0.20    # dimensionless [0,1]  - fill of bounding box
MIN_ASPECT_RATIO   = 0.20    # width/height lower limit
MAX_ASPECT_RATIO   = 5.0     # width/height upper limit

MIN_CIRCULARITY    = 0.45    # 4piA/P2 - 1.0 is a perfect circle
MIN_MEAN_EXG       = 0.05    # minimum mean ExG inside the contour mask

# ---------------------------------------------------------------------------
# DUAL-CUE CONFIRMATION GATE
# ---------------------------------------------------------------------------
# Colour cue  - triggered by MIN_MEAN_EXG  (configured above)
# Shape cue   - triggered by the geometry filters below
SHAPE_CUE_MIN_SOLIDITY    = MIN_SOLIDITY
SHAPE_CUE_MIN_CIRCULARITY = MIN_CIRCULARITY
SHAPE_CUE_MIN_AREA        = MIN_CONTOUR_AREA
SHAPE_CUE_MAX_AREA        = MAX_CONTOUR_AREA

# ---------------------------------------------------------------------------
# SIZE-SCALED BURST DURATION  (milliseconds)
# ---------------------------------------------------------------------------
# Formula:
#   T_burst = clip( T_MIN + (A / A_REF) * (T_MAX - T_MIN), T_MIN, T_MAX )
#
# All values are SIMULATION ASSUMPTIONS - pending pump bench calibration.

T_MIN_MS  = 80     # ms - minimum spray burst
T_MAX_MS  = 320    # ms - maximum spray burst
A_REF     = 12000  # px2 - reference area that maps to T_MAX

# ---------------------------------------------------------------------------
# FLOW RATE (LIQUID VOLUME SIMULATION)
# ---------------------------------------------------------------------------
# [SIMULATION ASSUMPTION]
# Physical pump calibration has NOT been performed.
# This placeholder is used only for theoretical volume calculations.
FLOW_RATE_ML_S = 2.0   # mL/s - assumed flow rate

# ---------------------------------------------------------------------------
# BLANKET-SPRAY BASELINE
# ---------------------------------------------------------------------------
# [SIMULATION ASSUMPTION]
# In a real pass, T_blanket = distance / speed.
# Here we use a virtual time window per processed frame.
VIRTUAL_TIME_PER_IMAGE_S = 0.5   # seconds per frame (software baseline)

# ---------------------------------------------------------------------------
# TEST-BED PHYSICAL DIMENSIONS  [SIMULATION ASSUMPTION]
# ---------------------------------------------------------------------------
BED_WIDTH_MM  = 500.0   # mm - assumed test-bed width
BED_HEIGHT_MM = 400.0   # mm - assumed test-bed height

# ---------------------------------------------------------------------------
# CAMERA-TO-NOZZLE OFFSET  [SIMULATION ASSUMPTION]
# ---------------------------------------------------------------------------
# Physical camera-nozzle offset has not been measured.
# Use configurable placeholders.
NOZZLE_OFFSET_X_MM =  50.0   # mm - nozzle is 50 mm ahead in X
NOZZLE_OFFSET_Y_MM =   0.0   # mm - nozzle is centred in Y

# ---------------------------------------------------------------------------
# AIM ERROR SIMULATION NOISE  [SIMULATION ASSUMPTION]
# ---------------------------------------------------------------------------
# Simulated Gaussian noise to emulate real-world aim uncertainty
AIM_NOISE_STD_MM = 5.0   # mm standard deviation [SIMULATION ASSUMPTION]

# ---------------------------------------------------------------------------
# OUTPUT PATHS
# ---------------------------------------------------------------------------
import os
_BASE = os.path.dirname(os.path.abspath(__file__))

DATA_DIR            = os.path.join(_BASE, "data")
MOCK_IMAGE_DIR      = os.path.join(_BASE, "data", "mock_images")
LABEL_DIR           = os.path.join(_BASE, "data", "labels")
TEST_IMAGE_DIR      = os.path.join(_BASE, "data", "test_images")

OUTPUT_DIR          = os.path.join(_BASE, "outputs")
ANNOTATED_DIR       = os.path.join(_BASE, "outputs", "annotated")
MASK_DIR            = os.path.join(_BASE, "outputs", "masks")
CONTOUR_DIR         = os.path.join(_BASE, "outputs", "contours")

EVENTS_CSV          = os.path.join(_BASE, "outputs", "events.csv")
METRICS_CSV         = os.path.join(_BASE, "outputs", "metrics.csv")
GATE_COMPARISON_CSV = os.path.join(_BASE, "outputs", "gate_comparison.csv")
COORDINATE_CSV      = os.path.join(_BASE, "outputs", "coordinate_tests.csv")
MOCK_LABELS_CSV     = os.path.join(_BASE, "data", "labels", "mock_labels.csv")

# ---------------------------------------------------------------------------
# MOCK DATASET GENERATION SETTINGS
# ---------------------------------------------------------------------------
TOTAL_IMAGES   = 200
N_WEED_IMAGES  = 80
N_CROP_IMAGES  = 80
N_BG_IMAGES    = 40

# Random seed for reproducibility
RANDOM_SEED = 42
