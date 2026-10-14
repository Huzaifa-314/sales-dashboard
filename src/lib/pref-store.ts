// Tiny localStorage-backed store for per-viewer preferences (theme, language).
// Storage may be unavailable (private window, blocked data), so every access is
// guarded and the fallback is used. Designed for useSyncExternalStore.
export function createPrefStore<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
) {
  const listeners = new Set<() => void>();

  function get(): T {
    try {
      const v = localStorage.getItem(key);
      return v && (allowed as readonly string[]).includes(v)
        ? (v as T)
        : fallback;
    } catch {
      return fallback;
    }
  }

  function set(value: T) {
    try {
      localStorage.setItem(key, value);
    } catch {}
    listeners.forEach((l) => l());
  }

  function subscribe(cb: () => void) {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }

  return { get, set, subscribe, getServer: () => fallback };
}
