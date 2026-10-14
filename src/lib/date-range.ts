// Date-range filter shared by every table that has a business date.
// Ranges are inclusive and compared as YYYY-MM-DD strings, so they never shift
// with the viewer's clock offset.

export type RangeKey =
  "all" | "today" | "7d" | "month" | "lastMonth" | "quarter" | "fy" | "custom";

// Order shown in the picker (Any time and Custom are handled separately).
export const PRESETS: Exclude<RangeKey, "all" | "custom">[] = [
  "today",
  "7d",
  "month",
  "lastMonth",
  "quarter",
  "fy",
];

// 0 = January. Replace with the company setting once settings exist.
export const FY_START_MONTH = 0;

export type Range = { from?: string; to?: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export const isRangeKey = (v: string): v is RangeKey =>
  v === "all" || v === "custom" || (PRESETS as string[]).includes(v);

export function resolveRange(
  key: RangeKey,
  from = "",
  to = "",
  now = new Date(),
): Range {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "today":
      return { from: iso(now), to: iso(now) };
    case "7d":
      return { from: iso(new Date(y, m, now.getDate() - 6)), to: iso(now) };
    case "month":
      return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case "lastMonth":
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) };
    }
    case "fy": {
      const startYear = m >= FY_START_MONTH ? y : y - 1;
      return {
        from: iso(new Date(startYear, FY_START_MONTH, 1)),
        to: iso(new Date(startYear + 1, FY_START_MONTH, 0)),
      };
    }
    case "custom": {
      const f = ISO.test(from) ? from : undefined;
      const t = ISO.test(to) ? to : undefined;
      // A reversed range is swapped rather than treated as empty.
      return f && t && f > t ? { from: t, to: f } : { from: f, to: t };
    }
    default:
      return {};
  }
}

export function inRange(date: string, range: Range) {
  const d = date.slice(0, 10);
  return (!range.from || d >= range.from) && (!range.to || d <= range.to);
}

export const isRangeActive = (range: Range) => !!(range.from || range.to);
