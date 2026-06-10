import { useCallback, useSyncExternalStore } from 'react';

/**
 * Returns the current time in epoch milliseconds, updating every
 * `intervalMs`. The clock is an external system, so it is exposed through
 * useSyncExternalStore to keep renders pure.
 */
export default function useNow(intervalMs = 1000): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const id = window.setInterval(onStoreChange, intervalMs);
      return () => window.clearInterval(id);
    },
    [intervalMs],
  );

  const getSnapshot = useCallback(
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    [intervalMs],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
