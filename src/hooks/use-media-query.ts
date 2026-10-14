"use client";

import { useSyncExternalStore } from "react";

// True while the media query matches. Server and first render say false (a
// phone), so desktop-only content appears after hydration, never before.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
