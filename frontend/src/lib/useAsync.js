import { useEffect, useState, useCallback } from "react";

// Minimal fetch hook: exposes {data, loading, error, reload}. Kept
// dependency-free and boring on purpose — this app's interesting logic
// lives in the Cypher, not in client-side data-fetching machinery.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const reload = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}
