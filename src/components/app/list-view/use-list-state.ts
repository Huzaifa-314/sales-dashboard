"use client";

import { useMemo } from "react";
import { formatMoney } from "@/components/app/money";
import { useDescribeRange } from "@/components/app/date-range-filter";
import { useT } from "@/components/app/preferences";
import { isRangeKey, resolveRange } from "@/lib/date-range";
import { useUrlState } from "@/lib/list-prefs";
import {
  ANY,
  isFilterActive,
  type FilterValue,
  type Query,
} from "@/lib/list-query";
import type { ListFilter } from "@/components/app/list-view/types";

// Everything a list keeps in the address bar: search, tab, sort, page, and each
// filter. Written once here, so every list names and reads its state the same
// way (and a view can be shared as a link). Filters are prefixed `f_`.

// 25 by default: accounting is scanned and compared, and ten rows means constant paging
const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export function useListState<T>(input: {
  tabs?: string[];
  sortKey: string;
  sortDir: "asc" | "desc";
  sortKeys: string[];
  filters: ListFilter<T>[];
  pageSizes?: number[];
}) {
  const t = useT();
  const describeRange = useDescribeRange();
  const pageSizes = input.pageSizes ?? DEFAULT_PAGE_SIZES;
  const firstSize = pageSizes.includes(DEFAULT_PAGE_SIZE)
    ? DEFAULT_PAGE_SIZE
    : pageSizes[0];

  const defaults = useMemo(() => {
    const d: Record<string, string> = {
      q: "",
      tab: input.tabs?.[0] ?? "",
      sort: input.sortKey,
      dir: input.sortDir,
      size: String(firstSize),
      page: "1",
    };
    for (const f of input.filters) {
      if (f.kind === "dateRange") {
        d[`f_${f.id}`] = "all";
        d[`f_${f.id}_from`] = "";
        d[`f_${f.id}_to`] = "";
      } else if (f.kind === "numberRange") {
        d[`f_${f.id}_min`] = "";
        d[`f_${f.id}_max`] = "";
      } else d[`f_${f.id}`] = ANY;
    }
    return d;
    // The shape of the list does not change while it is on screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [ui, setUi] = useUrlState(defaults);

  const num = (v: string) =>
    v && Number.isFinite(Number(v)) ? Number(v) : null;

  // Decode the address bar into the same `Query` a server would receive
  const filterValues: Record<string, FilterValue> = {};
  for (const f of input.filters) {
    if (f.kind === "dateRange") {
      const key = ui[`f_${f.id}`];
      filterValues[f.id] = {
        kind: "dateRange",
        range: resolveRange(
          isRangeKey(key) ? key : "all",
          ui[`f_${f.id}_from`],
          ui[`f_${f.id}_to`],
        ),
      };
    } else if (f.kind === "numberRange") {
      filterValues[f.id] = {
        kind: "numberRange",
        min: num(ui[`f_${f.id}_min`]),
        max: num(ui[`f_${f.id}_max`]),
      };
    } else {
      filterValues[f.id] = { kind: "select", value: ui[`f_${f.id}`] };
    }
  }

  const query: Query = {
    q: ui.q,
    tab: input.tabs?.includes(ui.tab) ? ui.tab : (input.tabs?.[0] ?? ""),
    sort: {
      key: input.sortKeys.includes(ui.sort) ? ui.sort : input.sortKey,
      dir: ui.dir === "asc" ? "asc" : "desc",
    },
    page: Math.max(1, Number(ui.page) || 1),
    pageSize: pageSizes.includes(Number(ui.size)) ? Number(ui.size) : firstSize,
    filters: filterValues,
  };

  // Resetting a filter to its default, by kind
  function patchFor(f: ListFilter<T>): Record<string, string> {
    if (f.kind === "dateRange")
      return {
        [`f_${f.id}`]: "all",
        [`f_${f.id}_from`]: "",
        [`f_${f.id}_to`]: "",
      };
    if (f.kind === "numberRange")
      return { [`f_${f.id}_min`]: "", [`f_${f.id}_max`]: "" };
    return { [`f_${f.id}`]: ANY };
  }

  const setFilter = (f: ListFilter<T>, patch: Record<string, string>) =>
    setUi({ ...patch, page: "1" });
  const clearFilter = (f: ListFilter<T>) =>
    setUi({ ...patchFor(f), page: "1" });

  function clearAll() {
    const patch: Record<string, string> = { q: "", page: "1" };
    if (input.tabs) patch.tab = input.tabs[0];
    for (const f of input.filters) Object.assign(patch, patchFor(f));
    setUi(patch);
  }

  function toggleSort(key: string, first: "asc" | "desc") {
    setUi(
      query.sort.key === key
        ? {
            sort: key,
            dir: query.sort.dir === "asc" ? "desc" : "asc",
            page: "1",
          }
        : { sort: key, dir: first, page: "1" },
    );
  }

  // One chip per active filter: the same words feed the summary line under the
  // toolbar and the header of an exported file.
  function chipFor(f: ListFilter<T>): string | undefined {
    const v = filterValues[f.id];
    if (!isFilterActive(v)) return undefined;
    if (f.kind === "dateRange" && v.kind === "dateRange")
      return `${f.label}: ${describeRange({
        range: isRangeKey(ui[`f_${f.id}`]) ? (ui[`f_${f.id}`] as never) : "all",
        from: ui[`f_${f.id}_from`],
        to: ui[`f_${f.id}_to`],
      })}`;
    if (f.kind === "numberRange" && v.kind === "numberRange") {
      // Whole ringgit on a chip: "≥ RM 1,000" reads faster than "RM 1,000.00"
      const fmt =
        f.format ?? ((n: number) => formatMoney(n).replace(/\.00$/, ""));
      const body =
        v.min !== null && v.max !== null
          ? `${fmt(v.min)} – ${fmt(v.max)}`
          : v.min !== null
            ? `≥ ${fmt(v.min)}`
            : `≤ ${fmt(v.max ?? 0)}`;
      return `${f.label}: ${body}`;
    }
    if (f.kind === "select" && v.kind === "select") {
      const opt = f.options.find((o) => o.value === v.value);
      return `${f.label}: ${opt?.label ?? v.value}`;
    }
    return undefined;
  }

  const searchChip = query.q.trim()
    ? t("table.chipSearch", { q: query.q.trim() })
    : undefined;

  return {
    ui,
    setUi,
    query,
    pageSizes,
    setFilter,
    clearFilter,
    clearAll,
    toggleSort,
    chipFor,
    searchChip,
    describeRange,
  };
}
