"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useSearchParams } from "next/navigation";
import { createPrefStore } from "@/lib/pref-store";
import type { Column, Density } from "@/components/app/data-table";

// Row density is a per-viewer preference shared by every table.
const densityStore = createPrefStore<Density>(
  "invoispro:density",
  "comfortable",
  ["comfortable", "compact"],
);

export function useDensity() {
  const density = useSyncExternalStore(
    densityStore.subscribe,
    densityStore.get,
    densityStore.getServer,
  );
  return [density, densityStore.set] as const;
}

// List state (search, filter, sort, page size, page) lives in the URL so a
// view survives a reload and can be shared. Defaults are left out of the URL.
// Read once on mount, then written with replaceState (no navigation, no
// re-render); Next syncs useSearchParams with it. Callers must render inside
// <Suspense> because of useSearchParams.
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const params = useSearchParams();
  const initial = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const v = params.get(key);
      if (v !== null) (out as Record<string, string>)[key] = v;
    }
    return out;
    // Initial values only; later changes flow the other way (state -> URL).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    for (const key of Object.keys(defaults)) {
      if (state[key] === defaults[key]) next.delete(key);
      else next.set(key, state[key]);
    }
    const qs = next.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [
    state,
    (patch: Partial<T>) => setState((s) => ({ ...s, ...patch })),
  ] as const;
}

// Which columns a table shows is a per-viewer preference, kept per table. The
// stored value is the list of shown column ids ("-" = only the locked ones);
// nothing stored means the table's defaults.
const columnListeners = new Set<() => void>();
const columnKey = (table: string) => `invoispro:columns:${table}`;

function readColumns(table: string): string | null {
  try {
    return localStorage.getItem(columnKey(table));
  } catch {
    return null;
  }
}

export function useColumnPrefs<T>(table: string, all: Column<T>[]) {
  const stored = useSyncExternalStore(
    (cb) => {
      columnListeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        columnListeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => readColumns(table),
    () => null,
  );

  const defaults = useMemo(
    () => all.filter((c) => !c.defaultHidden).map((c) => c.id),
    [all],
  );
  const shown = useMemo(() => {
    if (stored === null) return new Set(defaults);
    return new Set(stored === "-" ? [] : stored.split(","));
  }, [stored, defaults]);

  const visible = useMemo(
    () => all.filter((c) => c.locked || shown.has(c.id)),
    [all, shown],
  );

  const write = useCallback(
    (ids: string[] | null) => {
      try {
        if (ids === null) localStorage.removeItem(columnKey(table));
        else localStorage.setItem(columnKey(table), ids.join(",") || "-");
      } catch {}
      columnListeners.forEach((l) => l());
    },
    [table],
  );

  const toggle = (id: string, on: boolean) => {
    const next = new Set(shown);
    if (on) next.add(id);
    else next.delete(id);
    // Keep table order, not click order.
    write(all.filter((c) => !c.locked && next.has(c.id)).map((c) => c.id));
  };

  return {
    visible,
    isShown: (id: string) => shown.has(id),
    toggle,
    reset: () => write(null),
    customized: stored !== null,
  };
}
