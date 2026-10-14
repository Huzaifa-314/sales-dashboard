"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useT } from "@/components/app/preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The filter vocabulary for every list. A field is a small caption above one
// control; fields sit in a grid, the common ones always visible and the rest
// behind "More filters". Everything applies as you change it.

// Radix Select cannot hold an empty value, so "no filter" is this word.
export const ANY = "any";

export type FilterOption = { value: string; label: string };

// A caption above one control. The date range and amount fields draw their own.
export function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1.5 block text-caption text-ink-soft">{label}</span>
      {children}
    </div>
  );
}

// One-of-many filter. The first option should be "Any" (value ANY).
export function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <FilterField label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

// A from-to pair of numbers (amounts). Empty means no bound on that side.
export function RangeFilter({
  label,
  min,
  max,
  onChange,
  prefix = "RM",
}: {
  label: string;
  min: string;
  max: string;
  onChange: (next: { min: string; max: string }) => void;
  prefix?: string;
}) {
  const t = useT();
  // Digits and one decimal point only; thousands separators are not typed.
  const clean = (v: string) => v.replace(/[^\d.]/g, "");
  const box = "min-w-0 flex-1 bg-transparent text-body text-ink outline-none";
  return (
    <FilterField label={label}>
      <div
        role="group"
        aria-label={label}
        data-active={!!(min || max)}
        className="field-box flex min-h-11 w-full items-center gap-2 px-3"
      >
        <span aria-hidden className="text-caption text-ink-faint">
          {prefix}
        </span>
        <input
          inputMode="decimal"
          autoComplete="off"
          value={min}
          placeholder={t("table.min")}
          aria-label={`${label}: ${t("table.min")}`}
          onChange={(e) => onChange({ min: clean(e.target.value), max })}
          className={`${box} placeholder:text-ink-faint`}
        />
        <span aria-hidden className="text-ink-faint">
          –
        </span>
        <input
          inputMode="decimal"
          autoComplete="off"
          value={max}
          placeholder={t("table.max")}
          aria-label={`${label}: ${t("table.max")}`}
          onChange={(e) => onChange({ min, max: clean(e.target.value) })}
          className={`${box} placeholder:text-ink-faint`}
        />
      </div>
    </FilterField>
  );
}

// The grid itself: `main` fields always, `more` fields behind a toggle that
// shows how many of them are on. Opens by itself when one of them is on, so
// an active filter is never hidden. Used inline on desktop and inside the
// bottom sheet on a phone (where `stacked` makes it one column).
export function FilterGrid({
  main,
  more,
  moreCount = 0,
  stacked = false,
  action,
}: {
  main: ReactNode;
  more?: ReactNode;
  moreCount?: number;
  stacked?: boolean;
  // Sits at the end of the toggle row (the Reset button).
  action?: ReactNode;
}) {
  const t = useT();
  const id = useId();
  // null = follow the filters; true/false = the person chose.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? moreCount > 0;
  return (
    <div>
      <div
        className={`grid gap-x-4 gap-y-4 ${
          stacked
            ? "grid-cols-1"
            : "grid-cols-[repeat(auto-fill,minmax(240px,1fr))]"
        }`}
      >
        {main}
        {/* Mounted only while open, so nothing hidden can be tabbed into */}
        {more && open && (
          <div id={id} className="contents">
            {more}
          </div>
        )}
      </div>
      {(more || action) && (
        <div className="mt-4 flex items-center justify-between gap-3">
          {more ? (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open}
              aria-controls={open ? id : undefined}
              onClick={() => setChosen(!open)}
            >
              {open ? t("table.fewerFilters") : t("table.moreFilters")}
              {!open && moreCount > 0 && (
                <Badge
                  variant="solid"
                  aria-label={t("table.filtersOn", { count: moreCount })}
                >
                  {moreCount}
                </Badge>
              )}
              <ChevronDown
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className={`transition-transform duration-150 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </Button>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
    </div>
  );
}

// ---- The compact filter row (desktop): each filter is a small button. A filter
// that is on shows its value and turns the accent colour; the row never takes
// more than one line, and the full fields live in a popover behind each button.

export const chipClass = (active: boolean) =>
  cn(
    "inline-flex min-h-10 max-w-[260px] items-center gap-1.5 rounded-full border px-3 text-body whitespace-nowrap transition-colors duration-150",
    active
      ? "border-primary bg-surface text-primary"
      : "border-dashed border-field-border text-ink-soft hover:bg-surface-2 hover:text-ink",
  );

// One-of-many, as a chip (a Select with a chip for its button)
export function ChipSelect({
  label,
  activeLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  // The chip's text while a value is chosen ("Overdue by: 31–60 days")
  activeLabel?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const active = value !== ANY;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(
          chipClass(active),
          "w-fit bg-transparent data-[size=sm]:h-10",
        )}
      >
        <span className="truncate">{active ? activeLabel : label}</span>
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// A from-to pair of numbers, as a chip
export function ChipRange({
  label,
  activeLabel,
  min,
  max,
  onChange,
}: {
  label: string;
  activeLabel?: string;
  min: string;
  max: string;
  onChange: (next: { min: string; max: string }) => void;
}) {
  const t = useT();
  const active = !!(min || max);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          className={chipClass(active)}
        >
          <span className="truncate">{active ? activeLabel : label}</span>
          <ChevronDown size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-4">
        <RangeFilter label={label} min={min} max={max} onChange={onChange} />
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            disabled={!active}
            onClick={() => onChange({ min: "", max: "" })}
          >
            {t("table.clearFilter")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// "More filters": the filters that do not fit on the row, in one popover, with
// how many of them are on.
export function MoreFiltersChip({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          className={chipClass(count > 0)}
        >
          {count === 0 && <Plus size={14} strokeWidth={1.75} aria-hidden />}
          {t("table.moreFilters2")}
          {count > 0 && (
            <Badge variant="solid" aria-label={t("table.filtersOn", { count })}>
              {count}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="grid w-[340px] gap-4 p-4">
        {children}
      </PopoverContent>
    </Popover>
  );
}
