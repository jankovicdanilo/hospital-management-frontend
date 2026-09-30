import { useCallback, useEffect, useState } from 'react';
import { ApiError, getErrorMessage } from '../api/apiErrors';

export interface DateRangeSectionState<T> {
  data: T;
  loading: boolean;
  error: string;
  isRetryable: boolean;
}

/**
 * Loads one statistics section for the given date range. Kept generic so each of the
 * four independent statistics endpoints gets its own loading/error/retry state without
 * repeating the same fetch/error-handling block four times.
 */
export function useDateRangeSection<T>(
  fetcher: (from: string, to: string, token: string) => Promise<T>,
  initialData: T,
  from: string,
  to: string,
  token: string | undefined,
  enabled: boolean,
): [DateRangeSectionState<T>, () => void] {
  const [state, setState] = useState<DateRangeSectionState<T>>({
    data: initialData,
    loading: true,
    error: '',
    isRetryable: false,
  });

  const load = useCallback(async () => {
    if (!enabled || !token) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: '', isRetryable: false }));
    try {
      const data = await fetcher(from, to, token);
      setState({ data, loading: false, error: '', isRetryable: false });
    } catch (err) {
      const isRetryable = err instanceof ApiError && err.errorCode === 'UPSTREAM_FAILURE';
      setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err), isRetryable }));
    }
  }, [fetcher, from, to, token, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return [state, () => void load()];
}
