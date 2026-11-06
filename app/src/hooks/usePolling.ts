import { useCallback, useEffect, useRef, useState } from 'react';
import { appError, toAppError } from '@/services';
import type { AppError } from '@/types';

export interface PollingOptions<T> {
  fetcher: () => Promise<T>;
  /** Stop polling when this returns true. */
  isDone: (value: T) => boolean;
  intervalMs: number;
  timeoutMs: number;
  enabled?: boolean;
  /** Consecutive transient failures tolerated before surfacing an error. */
  maxConsecutiveErrors?: number;
}

/**
 * Generic poller: fixed interval, overall timeout, tolerant of a few transient errors,
 * and stoppable. Restarting resets the timeout.
 */
export function usePolling<T>({
  fetcher,
  isDone,
  intervalMs,
  timeoutMs,
  enabled = true,
  maxConsecutiveErrors = 3,
}: PollingOptions<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [active, setActive] = useState(enabled);
  const [generation, setGeneration] = useState(0);
  const fetcherRef = useRef(fetcher);
  const doneRef = useRef(isDone);
  fetcherRef.current = fetcher;
  doneRef.current = isDone;

  useEffect(() => {
    setActive(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > timeoutMs) {
        setError(appError('TIMEOUT', 'Polling timed out'));
        setActive(false);
        return;
      }
      try {
        const value = await fetcherRef.current();
        if (cancelled) return;
        failures = 0;
        setData(value);
        if (doneRef.current(value)) {
          setActive(false);
          return;
        }
      } catch (e) {
        if (cancelled) return;
        const err = toAppError(e);
        failures += 1;
        if (!err.retryable || failures >= maxConsecutiveErrors) {
          setError(err);
          setActive(false);
          return;
        }
      }
      timer = setTimeout(tick, intervalMs);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, generation, intervalMs, timeoutMs, maxConsecutiveErrors]);

  const stop = useCallback(() => setActive(false), []);
  const restart = useCallback(() => {
    setError(null);
    setData(undefined);
    setActive(true);
    setGeneration((g) => g + 1);
  }, []);

  return { data, error, polling: active, stop, restart };
}
