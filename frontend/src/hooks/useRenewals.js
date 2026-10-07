import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRenewals } from '../api/renewalsApi';

const DEFAULT_LIMIT = 10;

export function useRenewals({ month, page, limit = DEFAULT_LIMIT, status }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AbortController ref to cancel stale in-flight requests on month/filter switch
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRenewals({ month, page, limit, status });
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [month, page, limit, status]);

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  return { data, loading, error, refetch: load };
}
