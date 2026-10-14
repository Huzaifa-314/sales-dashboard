"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Checkbox } from "@/components/app/checkbox";

export type Density = "comfortable" | "compact";
export type SortDir = "asc" | "desc";

export type Column<T> = {
  id: string;
  header: string;
  // Sortable columns name the key the page sorts by.
  sortKey?: string;
  align?: "left" | "right";
  // Tailwind width class, e.g. "w-[140px]"; omit for the flexible column.
  width?: string;
  // Extra classes for th/td, e.g. "hidden xl:table-cell" to drop the column
  // on narrower screens.
  responsive?: string;
  // Show no visible header text (kept for screen readers), e.g. actions.
  hideHeader?: boolean;
  // Column chooser: a locked column is always shown and not listed; a
  // defaultHidden one starts off until the person turns it on.
  locked?: boolean;
  defaultHidden?: boolean;
  cell: (row: T, ctx: { compact: boolean }) => ReactNode;
  footer?: ReactNode;
  // The same figure for just the rows on this page (the "This page" row)
  pageFooter?: ReactNode;
};

// Sticky header: stays under the 56px top bar. Cells (not the row) carry the
// background and the bottom hairline, because borders do not stick.
const headBase =
  "sticky z-sticky bg-table-head text-caption font-medium text-ink-soft shadow-rule";

// The one data table: fixed columns (the same on every screen size), sortable
// headers, optional selection, optional totals row. Phones get `mobileRow`
// instead (the same rows as a list).
export function DataTable<T>({
  columns,
  rows,
  rowId,
  density = "comfortable",
  sort,
  selection,
  footerLabel,
  pageFooterLabel,
  mobileRow,
  rowHref,
}: {
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string;
  density?: Density;
  sort?: {
    key: string;
    dir: SortDir;
    onSort: (key: string) => void;
    ariaLabel: (column: string) => string;
  };
  selection?: {
    selected: Set<string>;
    onToggleRow: (id: string, on: boolean) => void;
    onTogglePage: (on: boolean) => void;
    allLabel: string;
    rowLabel: (row: T) => string;
  };
  footerLabel?: string;
  // Label of a subtotal row for this page only (shown when there is more than one page)
  pageFooterLabel?: string;
  mobileRow?: (row: T) => ReactNode;
  // Makes the whole row open this URL (links, buttons and menus inside the row
  // keep their own behaviour).
  rowHref?: (row: T) => string;
}) {
  const router = useRouter();
  const compact = density === "compact";
  const ids = rows.map(rowId);
  const picked = selection
    ? ids.filter((id) => selection.selected.has(id)).length
    : 0;
  // The columns' own widths set how narrow the table may get. Past that it
  // scrolls sideways (only then: a scrolling box would stop the header sticking
  // to the page).
  const minWidth = Math.max(
    680,
    (selection ? 56 : 0) +
      240 +
      columns.reduce((sum, c) => {
        const m = /(?:^|\s)w-\[(\d+)px\]/.exec(c.width ?? "");
        return sum + (m ? Number(m[1]) : 0);
      }, 0),
  );
  const box = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScrolls(minWidth > el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minWidth]);
  // Inside a sideways-scrolling box the header can only stick to that box.
  const headCell = `${headBase} ${scrolls ? "top-0" : "top-14"}`;
  const hasFooter =
    columns.some((c) => c.footer !== undefined) || !!footerLabel;

  return (
    <>
      {/* overflow-x-clip (not auto) so the header can stick to the page scroll;
          auto only when the chosen columns do not fit */}
      <div
        ref={box}
        className={`hidden md:block ${scrolls ? "overflow-x-auto" : "overflow-x-clip"}`}
      >
        <table
          style={{ minWidth }}
          className="w-full table-fixed border-collapse"
        >
          <thead>
            <tr className="h-12 text-left">
              {selection && (
                <th scope="col" className={`w-14 pl-1 ${headCell}`}>
                  <Checkbox
                    label={selection.allLabel}
                    checked={rows.length > 0 && picked === rows.length}
                    indeterminate={picked > 0 && picked < rows.length}
                    onChange={selection.onTogglePage}
                  />
                </th>
              )}
              {columns.map((c) => {
                const right = c.align === "right";
                const base = `${headCell} ${c.width ?? ""} ${c.responsive ?? ""} ${right ? "text-right" : "text-left"}`;
                if (!c.sortKey || !sort) {
                  return (
                    <th key={c.id} scope="col" className={`${base} pr-6`}>
                      {/* Blank columns (e.g. actions) keep a name for screen readers */}
                      {c.hideHeader ? (
                        <span className="sr-only">{c.header}</span>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                }
                const active = sort.key === c.sortKey;
                const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
                const arrow = (
                  <Icon
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden
                    className={
                      active
                        ? ""
                        : "opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60"
                    }
                  />
                );
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`${base} p-0`}
                  >
                    {/* The whole header cell is the button. Text stays aligned
                        with the cell content; the arrow shows on the active
                        column and on hover or focus. */}
                    <button
                      type="button"
                      onClick={() => sort.onSort(c.sortKey!)}
                      aria-label={sort.ariaLabel(c.header)}
                      className={`group/sort flex h-12 w-full items-center gap-1.5 pr-6 text-caption font-medium transition-colors duration-150 hover:text-ink ${
                        right ? "justify-end" : "justify-start"
                      } ${active ? "text-ink" : "text-ink-soft"}`}
                    >
                      {right && arrow}
                      {c.header}
                      {!right && arrow}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowId(row);
              const on = selection?.selected.has(id) ?? false;
              return (
                <tr
                  key={id}
                  onClick={
                    rowHref
                      ? (e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              'a,button,input,label,[role="menu"]',
                            )
                          )
                            return;
                          router.push(rowHref(row));
                        }
                      : undefined
                  }
                  className={`group border-b border-line transition-colors duration-150 ${
                    compact ? "h-[52px]" : "h-[68px]"
                  } ${rowHref ? "cursor-pointer" : ""} ${
                    on ? "bg-surface-2" : "hover:bg-surface-2/60"
                  }`}
                >
                  {selection && (
                    <td className="pl-1">
                      <Checkbox
                        label={selection.rowLabel(row)}
                        checked={on}
                        onChange={(v) => selection.onToggleRow(id, v)}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={`pr-6 ${c.responsive ?? ""} ${
                        c.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {c.cell(row, { compact })}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {hasFooter && (
            <tfoot>
              {pageFooterLabel &&
                columns.some((c) => c.pageFooter !== undefined) && (
                  <tr className="h-11 border-t border-line">
                    {selection && <td />}
                    {columns.map((c, i) => (
                      <td
                        key={c.id}
                        className={`num pr-6 text-caption text-ink-soft ${c.responsive ?? ""} ${
                          c.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {i === 0 ? pageFooterLabel : c.pageFooter}
                      </td>
                    ))}
                  </tr>
                )}
              <tr className="h-12 bg-surface-2/60">
                {selection && <td />}
                {columns.map((c, i) => (
                  <td
                    key={c.id}
                    className={`num pr-6 text-caption font-medium ${c.responsive ?? ""} ${
                      c.align === "right" ? "text-right" : "text-left"
                    } ${i === 0 ? "text-ink-soft" : ""}`}
                  >
                    {i === 0 ? footerLabel : c.footer}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {mobileRow && (
        <ul className="md:hidden">
          {rows.map((row) => (
            <li key={rowId(row)}>{mobileRow(row)}</li>
          ))}
        </ul>
      )}
    </>
  );
}
