import { useState, useEffect } from 'react';
import { fetchStatus } from '../api/client';

export function useBackendStatus(pollIntervalMs = 8000) {
  const [online, setOnline] = useState(false);
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const data = await fetchStatus();
        if (mounted) {
          setOnline(data.status === 'online');
          setStatusData(data);
        }
      } catch {
        if (mounted) {
          setOnline(false);
        }
      }
    };

    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return { online, statusData };
}
