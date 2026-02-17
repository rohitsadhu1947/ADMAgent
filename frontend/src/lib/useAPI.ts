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

  // Re-fetch when deps change
  useEffect(() => {
    refetch();
    if (pollInterval && pollInterval > 0) {
      const interval = setInterval(refetch, pollInterval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, pollInterval, ...(deps || [])]);

  return { data, loading, error, refetch };
}
