export function formatNumber(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return Number(val).toFixed(decimals);
}

export function formatArea(area) {
  if (!area && area !== 0) return '-';
  return `${Math.round(area).toLocaleString()} px²`;
}

export function formatMs(ms) {
  if (!ms && ms !== 0) return '-';
  return `${Math.round(ms)} ms`;
}

export function formatVolume(ml) {
  if (!ml && ml !== 0) return '-';
  return `${Number(ml).toFixed(3)} mL`;
}

export function formatCoordinate(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.0 mm';
  return `${Number(val).toFixed(1)} mm`;
}
