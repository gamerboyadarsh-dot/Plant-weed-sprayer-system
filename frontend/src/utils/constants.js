export const DEFAULT_PARAMS = {
  exg_threshold: 0.05,
  min_contour_area: 500,
  max_contour_area: 80000,
  min_circularity: 0.15,
  min_solidity: 0.40,
  t_min_ms: 80,
  t_max_ms: 320,
  a_ref: 12000,
  flow_rate_ml_s: 2.0,
  bed_width_mm: 500,
  bed_height_mm: 400,
  nozzle_offset_x_mm: 50,
  nozzle_offset_y_mm: 0,
};

export const PARAM_CONFIG = [
  {
    category: 'Vision Pipeline',
    items: [
      { key: 'exg_threshold', label: 'ExG Threshold', min: 0.01, max: 0.30, step: 0.01, unit: '', tooltip: 'Threshold for excess green index (2g - r - b) to isolate green vegetation.' },
      { key: 'min_contour_area', label: 'Min Contour Area', min: 100, max: 5000, step: 100, unit: 'px²', tooltip: 'Disregards small green flecks and soil artifacts below this size.' },
      { key: 'max_contour_area', label: 'Max Contour Area', min: 5000, max: 300000, step: 5000, unit: 'px²', tooltip: 'Upper bounds filter; rejects massive background vegetation clumps.' },
      { key: 'min_circularity', label: 'Min Circularity', min: 0.05, max: 1.0, step: 0.05, unit: '4πA/P²', tooltip: 'Shape metric; broadleaf weeds score high (~0.45+), linear crop leaves score low.' },
      { key: 'min_solidity', label: 'Min Solidity', min: 0.10, max: 1.0, step: 0.05, unit: '', tooltip: 'Ratio of contour area to its convex hull area.' },
    ]
  },
  {
    category: 'Micro-Dosing Actuation',
    items: [
      { key: 't_min_ms', label: 'Min Pulse Duration', min: 20, max: 200, step: 10, unit: 'ms', tooltip: 'Minimum solenoid open time for small weeds.' },
      { key: 't_max_ms', label: 'Max Pulse Duration', min: 100, max: 600, step: 20, unit: 'ms', tooltip: 'Upper safety cap for maximum dosage pulse on larger weeds.' },
      { key: 'flow_rate_ml_s', label: 'Flow Rate', min: 0.5, max: 10.0, step: 0.5, unit: 'mL/s', tooltip: 'Calibrated liquid chemical discharge rate of the spray nozzle.' },
    ]
  },
  {
    category: 'Gantry & Calibration',
    items: [
      { key: 'nozzle_offset_x_mm', label: 'Nozzle Offset X', min: -100, max: 100, step: 5, unit: 'mm', tooltip: 'Physical distance on X axis from camera optical center to nozzle.' },
      { key: 'nozzle_offset_y_mm', label: 'Nozzle Offset Y', min: -100, max: 100, step: 5, unit: 'mm', tooltip: 'Physical distance on Y axis from camera optical center to nozzle.' },
    ]
  }
];
