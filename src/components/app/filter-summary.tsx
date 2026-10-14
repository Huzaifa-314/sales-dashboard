"use client";

import { X } from "lucide-react";
import { Hint } from "@/components/app/hint";
import { useT } from "@/components/app/preferences";
import { Button } from "@/components/ui/button";

export type SummaryChip = {
  id: string;
  label: string;
  onRemove: () => void;
  // Filters already visible as buttons on desktop need no chip there
  hideOnDesktop?: boolean;
};

// One quiet line under the toolbar while any filter is on: how many rows match,
// the filters hidden behind the Filters button as removable chips, and the one
// way back to everything. Search and the tab are visible themselves, so they
// get no chip. Renders nothing when no filter is on.
export function FilterSummary({
  active,
  shown,
  total,
  chips = [],
  onReset,
  resetClassName = "",
}: {
  active: boolean;
  shown: number;
  total: number;
  chips?: SummaryChip[];
  onReset: () => void;
  // The panel above has its own Reset on desktop, so a list can hide this one there.
  resetClassName?: string;
}) {
  const t = useT();
  if (!active) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 lg:px-5">
      <p className="num mr-1 text-caption text-ink-soft" role="status">
        {t("table.showingOf", { shown, total })}
      </p>
      {chips.map((c) => (
        <span
          key={c.id}
          className={`inline-flex min-h-8 max-w-full items-center gap-1 rounded-control bg-surface-2 pl-2.5 pr-1 text-caption text-ink ${
            c.hideOnDesktop ? "md:hidden" : ""
          }`}
        >
          <span className="truncate">{c.label}</span>
          <Hint label={t("table.removeFilter", { label: c.label })}>
            <button
              type="button"
              onClick={c.onRemove}
              aria-label={t("table.removeFilter", { label: c.label })}
              className="flex size-6 shrink-0 items-center justify-center rounded-chip text-ink-soft transition-colors duration-150 hover:bg-surface hover:text-ink"
            >
              <X size={14} strokeWidth={1.5} aria-hidden />
            </button>
          </Hint>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className={`ml-auto ${resetClassName}`}
        onClick={onReset}
      >
        {t("table.reset")}
      </Button>
    </div>
  );
}
