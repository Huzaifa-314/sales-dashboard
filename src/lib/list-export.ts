// Builds the export table (CSV, Excel, PDF) from the same column definitions
// the screen uses, so the two can never drift apart.

import type { ExportColumn, ExportTable } from "./export.ts";

export type ExportSpec<T> = {
  // Defaults to the column's header
  label?: string;
  kind: ExportColumn["kind"];
  value: (row: T) => string | number;
  // Relative width in the PDF
  width: number;
  // A total in the last row: add the column up, or leave it empty
  total?: "sum";
};

export type ExportableColumn<T> = { header: string; export?: ExportSpec<T> };

export function buildExportTable<T>(input: {
  columns: ExportableColumn<T>[];
  rows: T[];
  title: string;
  // A line under the title: date, how many, which filters are on
  subtitle: string;
  footer: string;
  // Label of the totals row ("Total · 41 customers")
  totalLabel: string;
}): ExportTable {
  const cols = input.columns.filter(
    (c): c is { header: string; export: ExportSpec<T> } => !!c.export,
  );
  const hasTotals = cols.some((c) => c.export.total === "sum");
  return {
    title: input.title,
    subtitle: input.subtitle,
    footer: input.footer,
    columns: cols.map((c) => ({
      label: c.export.label ?? c.header,
      kind: c.export.kind,
      width: c.export.width,
    })),
    rows: input.rows.map((r) => cols.map((c) => c.export.value(r))),
    totals: hasTotals
      ? cols.map((c, i) => {
          if (c.export.total === "sum")
            return input.rows.reduce((s, r) => {
              const v = c.export.value(r);
              return s + (typeof v === "number" ? v : 0);
            }, 0);
          return i === 0 ? input.totalLabel : null;
        })
      : undefined,
  };
}
