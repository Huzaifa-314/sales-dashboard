"use client";

import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Card } from "@/components/app/card";
import { DataTable, type Column } from "@/components/app/data-table";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import {
  ANY,
  ChipRange,
  ChipSelect,
  RangeFilter,
  SelectFilter,
} from "@/components/app/filter-bar";
import { FilterSummary } from "@/components/app/filter-summary";
import { Hint } from "@/components/app/hint";
import {
  ExportMenu,
  type ExportFormat,
} from "@/components/app/list-view/export-menu";
import type {
  ListFilter,
  ListViewProps,
} from "@/components/app/list-view/types";
import { useListState } from "@/components/app/list-view/use-list-state";
import { ViewMenu } from "@/components/app/list-view/view-menu";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { useT } from "@/components/app/preferences";
import { panelId, tabId, TabBar } from "@/components/app/tab-bar";
import { Button } from "@/components/ui/button";
import { download, toCsv, toPdf, toXlsx } from "@/lib/export";
import { buildExportTable } from "@/lib/list-export";
import {
  applyQuery,
  isFilterActive,
  sortRows,
  type Rules,
} from "@/lib/list-query";
import { useColumnPrefs, useDensity } from "@/lib/list-prefs";

// The one list page. A module gives it rows and a description (columns,
// filters, tabs, search); it supplies the toolbar, tabs, filters and their
// summary, sorting, paging, selection, column chooser, density, Export, the
// bulk bar, the phone list, the empty states and the saved settings. Every
// list therefore behaves the same, and a new module is a config, not a copy.
//
// It reads the address bar (search, tab, sort, page, filters), so render it
// inside <Suspense>. See docs/design-system/README.md, "Building a list page".
export function ListView<T>(props: ListViewProps<T>) {
  const t = useT();
  const { id, rows, rowId, columns, entity, tabs, search, defaultSort } = props;
  const filters = props.filters ?? [];
  const tabItems = tabs?.items ?? [];

  const compares = Object.fromEntries(
    columns.filter((c) => c.compare).map((c) => [c.id, c.compare!]),
  );
  const rules: Rules<T> = {
    search: { fields: search.fields, phoneFields: search.phoneFields },
    filters: filters.map((f) =>
      f.kind === "select"
        ? {
            id: f.id,
            kind: "select" as const,
            options: Object.fromEntries(
              f.options.map((o) => [o.value, o.match]),
            ),
          }
        : f.kind === "numberRange"
          ? { id: f.id, kind: "numberRange" as const, value: f.value }
          : { id: f.id, kind: "dateRange" as const, value: f.value },
    ),
    tabs: tabItems.map((x) => ({ id: x.id, match: x.match })),
    compares,
    tiebreak: props.tiebreak,
  };

  const state = useListState<T>({
    tabs: tabItems.map((x) => x.id),
    sortKey: defaultSort.key,
    sortDir: defaultSort.dir,
    sortKeys: Object.keys(compares),
    filters,
    pageSizes: props.pageSizes,
  });
  const { query, setUi } = state;
  const result = applyQuery(rows, rules, query);

  const tabsPrefix = useId();
  const [density, setDensity] = useDensity();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [now] = useState(() => Date.now());

  // The screen's columns: the list's own, minus the export-only ones
  const screen: Column<T>[] = columns
    .filter((c) => !c.exportOnly)
    .map((c) => ({
      id: c.id,
      header: c.header,
      align: c.align,
      width: c.width,
      responsive: c.responsive,
      hideHeader: c.hideHeader,
      locked: c.locked,
      defaultHidden: c.defaultHidden,
      cell: c.cell,
      sortKey: c.compare ? c.id : undefined,
      footer: c.footer ? c.footer(result.filtered) : undefined,
      pageFooter: c.footer ? c.footer(result.pageRows) : undefined,
    }));
  const cols = useColumnPrefs(id, screen);

  const firstSort = (key: string) =>
    columns.find((c) => c.id === key)?.firstSort ?? "desc";

  // ---- Selection
  const pageIds = result.pageRows.map(rowId);
  const selectedRows = rows.filter((r) => selected.has(rowId(r)));
  function toggleRow(rid: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(rid);
      else next.delete(rid);
      return next;
    });
  }
  function togglePage(on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((rid) => (on ? next.add(rid) : next.delete(rid)));
      return next;
    });
  }

  // ---- Filters: the panel, the chips and the active counts all come from the
  // same definitions
  const placementOf = (f: ListFilter<T>) => f.placement ?? "main";
  const activeIn = (place: "main" | "more") =>
    filters.filter(
      (f) => placementOf(f) === place && isFilterActive(query.filters[f.id]),
    ).length;
  const mainOn = activeIn("main");
  const moreOn = activeIn("more");
  const firstTab = tabItems[0]?.id;
  const isFiltered =
    !!query.q.trim() ||
    mainOn + moreOn > 0 ||
    (!!firstTab && query.tab !== firstTab);

  function field(f: ListFilter<T>): ReactNode {
    const { ui } = state;
    if (f.kind === "dateRange")
      return (
        <div key={f.id} className={f.wide ? "md:col-span-2" : undefined}>
          <DateRangeFilter
            field={f.label}
            value={{
              range: (ui[`f_${f.id}`] as never) ?? "all",
              from: ui[`f_${f.id}_from`],
              to: ui[`f_${f.id}_to`],
            }}
            onChange={(v) =>
              state.setFilter(f, {
                [`f_${f.id}`]: v.range,
                [`f_${f.id}_from`]: v.from,
                [`f_${f.id}_to`]: v.to,
              })
            }
          />
        </div>
      );
    if (f.kind === "numberRange")
      return (
        <RangeFilter
          key={f.id}
          label={f.label}
          min={ui[`f_${f.id}_min`]}
          max={ui[`f_${f.id}_max`]}
          onChange={(v) =>
            state.setFilter(f, {
              [`f_${f.id}_min`]: v.min,
              [`f_${f.id}_max`]: v.max,
            })
          }
        />
      );
    return (
      <SelectFilter
        key={f.id}
        label={f.label}
        value={ui[`f_${f.id}`]}
        options={[
          { value: ANY, label: t("table.any") },
          ...f.options.map((o) => ({ value: o.value, label: o.label })),
        ]}
        onChange={(v) => state.setFilter(f, { [`f_${f.id}`]: v })}
      />
    );
  }

  // Desktop: each main filter as a small button; one that is on shows its value
  function chip(f: ListFilter<T>): ReactNode {
    const { ui } = state;
    const activeLabel = state.chipFor(f);
    if (f.kind === "dateRange")
      return (
        <DateRangeFilter
          key={f.id}
          variant="chip"
          field={f.label}
          activeLabel={activeLabel}
          value={{
            range: (ui[`f_${f.id}`] as never) ?? "all",
            from: ui[`f_${f.id}_from`],
            to: ui[`f_${f.id}_to`],
          }}
          onChange={(v) =>
            state.setFilter(f, {
              [`f_${f.id}`]: v.range,
              [`f_${f.id}_from`]: v.from,
              [`f_${f.id}_to`]: v.to,
            })
          }
        />
      );
    if (f.kind === "numberRange")
      return (
        <ChipRange
          key={f.id}
          label={f.label}
          activeLabel={activeLabel}
          min={ui[`f_${f.id}_min`]}
          max={ui[`f_${f.id}_max`]}
          onChange={(v) =>
            state.setFilter(f, {
              [`f_${f.id}_min`]: v.min,
              [`f_${f.id}_max`]: v.max,
            })
          }
        />
      );
    return (
      <ChipSelect
        key={f.id}
        label={f.label}
        activeLabel={activeLabel}
        value={ui[`f_${f.id}`]}
        options={[
          { value: ANY, label: t("table.any") },
          ...f.options.map((o) => ({ value: o.value, label: o.label })),
        ]}
        onChange={(v) => state.setFilter(f, { [`f_${f.id}`]: v })}
      />
    );
  }

  const chips = filters.flatMap((f) => {
    const label = state.chipFor(f);
    return label
      ? [
          {
            id: f.id,
            label,
            onRemove: () => state.clearFilter(f),
            // A main filter is already a button on desktop; only "more" ones need a chip
            hideOnDesktop: placementOf(f) === "main",
          },
        ]
      : [];
  });

  // ---- Export: the selection if there is one, else everything the list
  // holds after search, filters and tab (across all pages)
  const exportRows = selected.size
    ? sortRows(selectedRows, rules, query.sort)
    : result.filtered;
  const what = entity.count(exportRows.length);

  function exportAs(format: ExportFormat) {
    const today = new Date(now).toISOString().slice(0, 10);
    const tabLabel =
      !selected.size && firstTab && query.tab !== firstTab
        ? tabItems.find((x) => x.id === query.tab)?.label
        : undefined;
    const subtitle = [
      today,
      what,
      ...(selected.size
        ? []
        : [tabLabel, state.searchChip, ...chips.map((c) => c.label)]),
    ]
      .filter(Boolean)
      .join(" · ");
    const table = buildExportTable({
      columns,
      rows: exportRows,
      title: entity.title,
      subtitle,
      footer: t("table.generated"),
      totalLabel: t("table.exportTotal", { what }),
    });
    const name = `${id}-${today}`;
    if (format === "csv") download(toCsv(table), `${name}.csv`);
    else if (format === "xlsx") download(toXlsx(table), `${name}.xlsx`);
    else download(toPdf(table), `${name}.pdf`);
    toast.success(t("table.exported", { what, format: format.toUpperCase() }));
  }
  const exportHeading = selected.size
    ? t("table.exportSel", { what })
    : t("table.exportAll", { what });

  // ---- Nothing at all yet
  if (rows.length === 0 && props.empty)
    return <Card className="mt-8">{props.empty}</Card>;

  const setTab = (tid: string) => setUi({ tab: tid, page: "1" });

  return (
    <>
      {props.above && (
        <div className="mt-6">
          {props.above({
            tab: query.tab,
            setTab,
            toggleTab: (tid) => setTab(query.tab === tid ? firstTab : tid),
          })}
        </div>
      )}

      <Card className="mt-6">
        {tabs && (
          <TabBar
            label={tabs.label}
            idPrefix={tabsPrefix}
            value={query.tab}
            onChange={setTab}
            tabs={tabItems.map((x) => ({
              id: x.id,
              label: x.label,
              badge: result.counts[x.id],
            }))}
          />
        )}
        <ListToolbar
          search={{
            value: query.q,
            onChange: (v) => setUi({ q: v, page: "1" }),
            label: search.label,
            placeholder: search.placeholder,
          }}
          filters={
            filters.length > 0
              ? {
                  count: mainOn + moreOn,
                  moreCount: moreOn,
                  onReset: state.clearAll,
                  resetDisabled: !isFiltered,
                  chips: (
                    <>
                      {filters
                        .filter((f) => placementOf(f) === "main")
                        .map(chip)}
                    </>
                  ),
                  main: (
                    <>
                      {filters
                        .filter((f) => placementOf(f) === "main")
                        .map(field)}
                    </>
                  ),
                  more: filters.some((f) => placementOf(f) === "more") ? (
                    <>
                      {filters
                        .filter((f) => placementOf(f) === "more")
                        .map(field)}
                    </>
                  ) : undefined,
                }
              : undefined
          }
          tools={
            <>
              <ExportMenu onExport={exportAs} heading={exportHeading} />
              <ViewMenu
                columns={screen}
                isShown={cols.isShown}
                onToggle={cols.toggle}
                onReset={cols.reset}
                customized={cols.customized}
                density={density}
                onDensity={setDensity}
              />
            </>
          }
        />
        <FilterSummary
          active={isFiltered}
          shown={result.filtered.length}
          total={rows.length}
          onReset={state.clearAll}
          chips={chips}
        />

        <div
          role={tabs ? "tabpanel" : undefined}
          id={tabs ? panelId(tabsPrefix, query.tab) : undefined}
          aria-labelledby={tabs ? tabId(tabsPrefix, query.tab) : undefined}
        >
          <p className="sr-only" role="status">
            {t("table.showingOf", {
              shown: result.pageRows.length,
              total: result.filtered.length,
            })}
          </p>

          {result.filtered.length === 0 ? (
            <EmptyState
              title={t("table.noMatchTitle")}
              description={t("table.noMatchBody")}
              action={
                <Button variant="secondary" onClick={state.clearAll}>
                  {t("table.clearAll")}
                </Button>
              }
            />
          ) : (
            <>
              <DataTable
                columns={cols.visible}
                rows={result.pageRows}
                rowId={rowId}
                density={density}
                footerLabel={t("table.totalAll", {
                  what: entity.count(result.filtered.length),
                })}
                pageFooterLabel={
                  result.pages > 1 ? t("table.totalPage") : undefined
                }
                rowHref={props.rowHref}
                mobileRow={props.mobileRow}
                sort={{
                  key: query.sort.key,
                  dir: query.sort.dir,
                  onSort: (key) => state.toggleSort(key, firstSort(key)),
                  ariaLabel: (column) => t("table.sortBy", { column }),
                }}
                selection={{
                  selected,
                  onToggleRow: toggleRow,
                  onTogglePage: togglePage,
                  allLabel: t("table.selectAll"),
                  rowLabel: (r) =>
                    t("table.selectRow", { name: props.rowLabel(r) }),
                }}
              />
              <Pagination
                page={result.current}
                pageSize={query.pageSize}
                total={result.filtered.length}
                sizes={state.pageSizes}
                onPage={(p) => setUi({ page: String(p) })}
                onPageSize={(s) => setUi({ size: String(s), page: "1" })}
              />
            </>
          )}
        </div>
      </Card>

      {/* Bulk bar: sticks to the bottom of the screen while rows are selected,
          so the filters above never move. */}
      {selected.size > 0 && (
        <div className="pointer-events-none sticky bottom-20 z-float mt-4 flex justify-center lg:bottom-6 lg:justify-start">
          <div
            role="region"
            aria-label={t("table.bulkLabel")}
            className="pointer-events-auto flex max-w-full animate-rise flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 shadow-pop"
          >
            <p className="num mr-2 text-body font-medium" role="status">
              {t("table.selected", { count: selected.size })}
            </p>
            {props.bulkActions?.({
              selected: selectedRows,
              clear: () => setSelected(new Set()),
            })}
            <ExportMenu small onExport={exportAs} heading={exportHeading} />
            <Hint label={t("table.clearSelection")}>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                aria-label={t("table.clearSelection")}
                className="flex size-9 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <X size={18} strokeWidth={1.5} aria-hidden />
              </button>
            </Hint>
          </div>
        </div>
      )}
    </>
  );
}
