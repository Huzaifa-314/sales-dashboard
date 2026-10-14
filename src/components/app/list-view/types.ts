import type { ReactNode } from "react";
import type { Column } from "@/components/app/data-table";
import type { ExportSpec } from "@/lib/list-export";
import type { SortState } from "@/lib/list-query";

// One column definition serves the screen AND the export, so the two cannot
// drift apart.
export type ListColumn<T> = Omit<Column<T>, "sortKey" | "footer"> & {
  // Makes the column sortable (its id is the sort key)
  compare?: (a: T, b: T) => number;
  // Direction on the first click. Defaults to "desc" (biggest first).
  firstSort?: "asc" | "desc";
  // Cell in the totals row; receives every row the list holds, not just the page
  footer?: (rows: T[]) => ReactNode;
  // How it appears in the exported file. No `export`: not exported.
  export?: ExportSpec<T>;
  // In the export only, never on screen (phone, email…)
  exportOnly?: boolean;
};

type Placement = { placement?: "main" | "more" };

export type ListFilter<T> =
  | ({
      kind: "dateRange";
      id: string;
      label: string;
      value: (row: T) => string;
      // Takes two grid columns
      wide?: boolean;
    } & Placement)
  | ({
      kind: "numberRange";
      id: string;
      label: string;
      value: (row: T) => number;
      format?: (n: number) => string;
    } & Placement)
  | ({
      kind: "select";
      id: string;
      label: string;
      // "Any" is added for you
      options: { value: string; label: string; match: (row: T) => boolean }[];
    } & Placement);

export type ListTab<T> = {
  id: string;
  label: string;
  match: (row: T) => boolean;
};

export type ListViewProps<T> = {
  // Names the saved settings (columns, density) and the export file
  id: string;
  rows: T[];
  rowId: (row: T) => string;
  columns: ListColumn<T>[];
  // Display names: the export title, and "41 customers" for counts
  entity: { title: string; count: (n: number) => string };

  tabs?: { label: string; items: ListTab<T>[] };
  search: {
    label: string;
    placeholder: string;
    fields: (row: T) => (string | null | undefined)[];
    phoneFields?: (row: T) => (string | null | undefined)[];
  };
  filters?: ListFilter<T>[];

  defaultSort: SortState;
  // Used when two rows tie on the chosen sort
  tiebreak?: (a: T, b: T) => number;
  pageSizes?: number[];

  rowHref?: (row: T) => string;
  // Names a row for screen readers ("Select Teo Chee Keong")
  rowLabel: (row: T) => string;
  mobileRow?: (row: T) => ReactNode;

  // Buttons in the bar that appears while rows are selected (Export and Clear
  // are always there)
  bulkActions?: (ctx: { selected: T[]; clear: () => void }) => ReactNode;
  // Content above the list (the KPI band). It can read and change the tab.
  above?: (ctx: {
    tab: string;
    setTab: (id: string) => void;
    toggleTab: (id: string) => void;
  }) => ReactNode;
  // Shown instead of everything when there are no rows at all
  empty?: ReactNode;
};
