import { useCallback, useEffect, useRef, useState } from 'react';
import { toAppError, useServices, type Services } from '@/services';
import type { AppError } from '@/types';

export interface QueryState<T> {
  data: T | undefined;
  error: AppError | null;
  loading: boolean;
  /** True while re-fetching with data already on screen. */
  refreshing: boolean;
  reload: () => void;
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

/**
 * Loads data through the service layer. Stale responses (after deps change) are ignored.
 * Every screen gets loading / error / retry for free.
 */
export function useServiceQuery<T>(
  fetcher: (services: Services) => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): QueryState<T> {
  const services = useServices();
  const enabled = options.enabled ?? true;
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcherRef
      .current(services)
      .then((result) => {
        if (id === requestId.current) setDataState(result);
      })
      .catch((e: unknown) => {
        if (id === requestId.current) setError(toAppError(e));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, enabled, tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: T | undefined) => T)(prev) : updater));
  }, []);

  // Between enabling a query and its effect running, treat it as loading so screens never
  // render with data still undefined.
  const pending = loading || (enabled && data === undefined && error === null);
  return { data, error, loading: pending && data === undefined, refreshing: loading && data !== undefined, reload, setData };
}

/** Imperative service call with loading/error state (for buttons and forms). */
export function useServiceAction<A extends unknown[], R>(action: (services: Services, ...args: A) => Promise<R>) {
  const services = useServices();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(
    async (...args: A): Promise<R> => {
      setLoading(true);
      setError(null);
      try {
        return await actionRef.current(services, ...args);
      } catch (e) {
        const err = toAppError(e);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [services],
  );

  return { run, loading, error, clearError: () => setError(null) };
}
