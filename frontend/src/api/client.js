export async function fetchStatus() {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error(`Status error: ${res.status}`);
  return res.json();
}

export async function fetchImages() {
  const res = await fetch('/api/images');
  if (!res.ok) throw new Error(`Images error: ${res.status}`);
  return res.json();
}

export async function processPipeline(payload) {
  const res = await fetch('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Pipeline processing error: ${res.status}`);
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error(`Events error: ${res.status}`);
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error(`Analytics error: ${res.status}`);
  return res.json();
}
