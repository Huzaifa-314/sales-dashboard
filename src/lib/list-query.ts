// The list pipeline, as plain functions: search -> filters -> tab counts ->
// tab -> sort -> page. It has no React in it, so it is easy to test, and the
// `Query` it takes is exactly what a server endpoint would receive later:
// replace `applyQuery(rows, rules, query)` with a request that sends the same
// `query`, and no page has to change.

import { inRange, type Range } from "./date-range.ts";

export type FilterValue =
  | { kind: "dateRange"; range: Range }
  | { kind: "numberRange"; min: number | null; max: number | null }
  | { kind: "select"; value: string };

export type SortState = { key: string; dir: "asc" | "desc" };

export type Query = {
  q: string;
  tab: string;
  sort: SortState;
  page: number;
  pageSize: number;
  filters: Record<string, FilterValue>;
};

export type SearchRule<T> = {
  // Matched as plain, case-insensitive text
  fields: (row: T) => (string | null | undefined)[];
  // Matched by digits only, so "012 336" finds "012-336 9054"
  phoneFields?: (row: T) => (string | null | undefined)[];
};

export type FilterRule<T> =
  | { id: string; kind: "dateRange"; value: (row: T) => string }
  | { id: string; kind: "numberRange"; value: (row: T) => number }
  | {
      id: string;
      kind: "select";
      // value -> predicate. A value without one (or "any") matches everything.
      options: Record<string, ((row: T) => boolean) | undefined>;
    };

export type TabRule<T> = { id: string; match: (row: T) => boolean };

export type Rules<T> = {
  search?: SearchRule<T>;
  filters: FilterRule<T>[];
  tabs?: TabRule<T>[];
  compares: Record<string, (a: T, b: T) => number>;
  // Applied when two rows tie on the chosen sort
  tiebreak?: (a: T, b: T) => number;
};

export const ANY = "any";

export function matchesSearch<T>(row: T, search: SearchRule<T>, q: string) {
  const text = q.trim().toLowerCase();
  if (!text) return true;
  const digits = text.replace(/\D/g, "");
  if (search.fields(row).some((f) => f && f.toLowerCase().includes(text)))
    return true;
  return (
    digits.length > 0 &&
    !!search
      .phoneFields?.(row)
      .some((f) => f && f.replace(/\D/g, "").includes(digits))
  );
}

export function matchesFilters<T>(
  row: T,
  rules: FilterRule<T>[],
  values: Record<string, FilterValue>,
) {
  return rules.every((rule) => {
    const v = values[rule.id];
    if (!v) return true;
    if (rule.kind === "dateRange" && v.kind === "dateRange")
      return inRange(rule.value(row), v.range);
    if (rule.kind === "numberRange" && v.kind === "numberRange") {
      const n = rule.value(row);
      return (v.min === null || n >= v.min) && (v.max === null || n <= v.max);
    }
    if (rule.kind === "select" && v.kind === "select")
      return v.value === ANY || (rule.options[v.value]?.(row) ?? true);
    return true;
  });
}

export function isFilterActive(v: FilterValue | undefined) {
  if (!v) return false;
  if (v.kind === "dateRange") return !!(v.range.from || v.range.to);
  if (v.kind === "numberRange") return v.min !== null || v.max !== null;
  return v.value !== ANY;
}

export type Result<T> = {
  // After search and filters, before the tab
  matching: T[];
  counts: Record<string, number>;
  // After the tab, sorted: everything the list holds, across all pages
  filtered: T[];
  pages: number;
  current: number;
  pageRows: T[];
};

export function sortRows<T>(rows: T[], rules: Rules<T>, sort: SortState) {
  const cmp = rules.compares[sort.key];
  if (!cmp) return [...rows];
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) => sign * cmp(a, b) || (rules.tiebreak ? rules.tiebreak(a, b) : 0),
  );
}

export function applyQuery<T>(
  rows: T[],
  rules: Rules<T>,
  query: Query,
): Result<T> {
  const matching = rows.filter(
    (r) =>
      matchesFilters(r, rules.filters, query.filters) &&
      (!rules.search || matchesSearch(r, rules.search, query.q)),
  );
  const tabs = rules.tabs ?? [];
  const counts = Object.fromEntries(
    tabs.map((t) => [t.id, matching.filter(t.match).length]),
  );
  const tab = tabs.find((t) => t.id === query.tab);
  const inTab = tab ? matching.filter(tab.match) : matching;
  const filtered = sortRows(inTab, rules, query.sort);
  const pages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const current = Math.min(Math.max(1, query.page), pages);
  const pageRows = filtered.slice(
    (current - 1) * query.pageSize,
    current * query.pageSize,
  );
  return { matching, counts, filtered, pages, current, pageRows };
}
