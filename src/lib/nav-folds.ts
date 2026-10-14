"use client";

import { useSyncExternalStore } from "react";

// Which sidebar groups the person has folded or opened, kept in localStorage
// (a per-viewer convenience). Nothing stored for a group means "use its
// default". Storage may be unavailable, so every access is guarded.
const KEY = "invoispro:nav-folds";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): Record<string, boolean> {
  try {
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useNavFolds() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const folds = parse(raw);
  return {
    // open: what the person chose; undefined if they never did
    chosen: (key: string) => folds[key],
    set(key: string, open: boolean) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...folds, [key]: open }));
      } catch {}
      listeners.forEach((l) => l());
    },
  };
}
