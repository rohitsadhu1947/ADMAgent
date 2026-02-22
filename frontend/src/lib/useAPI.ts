'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useAPI<T>(
  fetcher: () => Promise<T>,
  pollInterval?: number,
  deps?: any[],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Silent refetch — updates data without setting loading=true (no UI flash/re-render storm)
  const silentRefetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    }
  }, []);

  // Full refetch — shows loading state (used for initial load & manual refresh)
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + optional polling (polls silently — no loading flash)
  useEffect(() => {
    refetch();
    if (pollInterval && pollInterval > 0) {
      const interval = setInterval(silentRefetch, pollInterval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, silentRefetch, pollInterval, ...(deps || [])]);

  return { data, loading, error, refetch };
}
