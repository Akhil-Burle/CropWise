/**
 * Tiny event channel so any service failure with UNAUTHORIZED can expire the session globally,
 * regardless of which adapter or token mechanism produced it.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export const sessionEvents = {
  onUnauthorized(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitUnauthorized(): void {
    listeners.forEach((l) => l());
  },
};
