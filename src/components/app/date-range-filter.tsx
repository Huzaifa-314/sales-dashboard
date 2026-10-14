"use client";

import { useRef, useState } from "react";
import { DayPicker, DayFlag, SelectionState, UI } from "react-day-picker";
import { enGB, ms } from "react-day-picker/locale";
import { ArrowRight, CalendarDays, ChevronDown } from "lucide-react";
import { chipClass } from "@/components/app/filter-bar";
import { Hint } from "@/components/app/hint";
import { useLang, useT } from "@/components/app/preferences";
import { PRESETS, resolveRange, type RangeKey } from "@/lib/date-range";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MessageKey } from "@/i18n/messages";

export type DateRangeValue = { range: RangeKey; from: string; to: string };

const presetLabel: Record<(typeof PRESETS)[number], MessageKey> = {
  today: "table.rangeToday",
  "7d": "table.range7d",
  month: "table.rangeMonth",
  lastMonth: "table.rangeLastMonth",
  quarter: "table.rangeQuarter",
  fy: "table.rangeFy",
};

// ISO (YYYY-MM-DD) <-> Date <-> "DD/MM/YYYY" (what people type in Malaysia).
const toDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`) : undefined;
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
const toText = (iso?: string) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";

// "1/10/2026", "01-10-2026" and "01.10.2026" all work; impossible dates do not.
function parseText(text: string): string | null | undefined {
  const t = text.trim();
  if (!t) return undefined; // empty: no bound
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (!m) return null; // unreadable
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return toIso(date);
}

// "This month", "1 Oct 2026 – 31 Oct 2026", "From 1 Oct 2026"… for summaries
// and exports.
export function useDescribeRange() {
  const t = useT();
  const [lang] = useLang();
  const fmt = new Intl.DateTimeFormat(lang === "ms" ? "ms-MY" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const show = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`));
  return (v: DateRangeValue) => {
    if (v.range === "all") return t("table.rangeAll");
    if (v.range !== "custom") return t(presetLabel[v.range]);
    const r = resolveRange("custom", v.from, v.to);
    if (r.from && r.to) return `${show(r.from)} – ${show(r.to)}`;
    if (r.from) return t("table.rangeFrom", { date: show(r.from) });
    if (r.to) return t("table.rangeUntil", { date: show(r.to) });
    return t("table.rangeAll");
  };
}

// Day cells, styled with our tokens (the library ships no styles here).
const calendarClasses = {
  [UI.Root]: "relative",
  [UI.Months]: "flex flex-col gap-6 sm:flex-row sm:gap-8",
  [UI.Month]: "w-[280px]",
  [UI.MonthCaption]: "flex h-10 items-center justify-center",
  [UI.CaptionLabel]: "text-body font-semibold",
  [UI.Nav]: "absolute inset-x-0 top-0 flex h-10 items-center justify-between",
  [UI.PreviousMonthButton]:
    "flex size-9 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink",
  [UI.NextMonthButton]:
    "flex size-9 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink",
  [UI.Chevron]: "fill-current",
  [UI.MonthGrid]: "w-full border-collapse",
  [UI.Weekday]: "h-9 w-10 text-center text-caption font-medium text-ink-faint",
  [UI.Day]: "p-0 text-center",
  [UI.DayButton]:
    "mx-auto flex size-10 items-center justify-center rounded-control text-body text-ink transition-colors duration-150 hover:bg-surface-2",
  [DayFlag.today]: "[&>button]:font-semibold [&>button]:text-primary",
  [DayFlag.disabled]: "opacity-40",
  [DayFlag.outside]: "opacity-40",
  [SelectionState.range_middle]:
    "bg-surface-2 [&>button]:rounded-none [&>button]:hover:bg-line",
  [SelectionState.range_start]:
    "rounded-l-control bg-surface-2 [&>button]:bg-primary [&>button]:text-on-primary [&>button]:hover:bg-primary-hover",
  [SelectionState.range_end]:
    "rounded-r-control bg-surface-2 [&>button]:bg-primary [&>button]:text-on-primary [&>button]:hover:bg-primary-hover",
};

// Two typeable dates and a two-month range calendar, with presets beside it.
// Click a start day, then an end day, and it applies. Presets apply at once.
export function DateRangeFilter({
  value,
  onChange,
  field,
  variant = "field",
  activeLabel,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  // Which date this filters, shown above the control ("Last activity").
  field: string;
  // "field": two typeable dates (the phone sheet). "chip": a compact button
  // that opens the same presets and calendar (the desktop filter row).
  variant?: "field" | "chip";
  // The chip's text while a range is set ("Last activity: This month")
  activeLabel?: string;
}) {
  const t = useT();
  const [lang] = useLang();
  const resolved = resolveRange(value.range, value.from, value.to);
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(true);
  const [draft, setDraft] = useState<{ from?: string }>({});
  // Text being typed; null while the fields just mirror the real value.
  const [typed, setTyped] = useState<{ from: string; to: string } | null>(null);
  const fromText = typed ? typed.from : toText(resolved.from);
  const toTextValue = typed ? typed.to : toText(resolved.to);
  const control = useRef<HTMLDivElement>(null);
  const calendarButton = useRef<HTMLButtonElement>(null);

  function show() {
    if (open) return;
    // Two months fit beside the presets from 860px; below that, one month.
    setWide(window.innerWidth >= 860);
    setDraft({});
    setOpen(true);
  }

  function pick(range: RangeKey) {
    onChange({ range, from: "", to: "" });
    setOpen(false);
    calendarButton.current?.focus();
  }

  // First click starts a range, second click ends it (earlier day = new start).
  function pickDay(day: Date) {
    const iso = toIso(day);
    if (!draft.from) {
      setDraft({ from: iso });
      return;
    }
    const [from, to] = iso < draft.from ? [iso, draft.from] : [draft.from, iso];
    onChange({ range: "custom", from, to });
    setOpen(false);
    calendarButton.current?.focus();
  }

  // Typed dates apply when the field loses focus or Enter is pressed.
  function commitText() {
    if (!typed) return;
    const f = parseText(typed.from);
    const to = parseText(typed.to);
    setTyped(null);
    if (f === null || to === null) return; // unreadable: keep the real value
    if (f === resolved.from && to === resolved.to) return;
    if (!f && !to) return pick("all");
    onChange({ range: "custom", from: f ?? "", to: to ?? "" });
  }

  const active = value.range !== "all";
  // While a range is being picked only its start is shown; otherwise the
  // current range is highlighted.
  const selected = draft.from
    ? { from: toDate(draft.from), to: undefined }
    : { from: toDate(resolved.from), to: toDate(resolved.to) };
  const dateInput =
    "min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint";

  const panel = (
    <div className="flex flex-col sm:flex-row">
      <ul className="flex shrink-0 gap-1 overflow-x-auto border-b border-line p-2 sm:w-48 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
        {(["all", ...PRESETS] as const).map((key) => {
          const on = value.range === key;
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => pick(key)}
                className={`flex min-h-10 w-full items-center rounded-control px-3 text-left text-body whitespace-nowrap transition-colors duration-150 hover:bg-surface-2 ${
                  on ? "bg-surface-2 font-medium text-ink" : "text-ink-soft"
                }`}
              >
                {key === "all" ? t("table.rangeAll") : t(presetLabel[key])}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="p-4">
        <DayPicker
          mode="range"
          locale={lang === "ms" ? ms : enGB}
          numberOfMonths={wide ? 2 : 1}
          defaultMonth={toDate(resolved.from) ?? new Date()}
          selected={selected}
          onDayClick={pickDay}
          classNames={calendarClasses}
        />
        <p className="mt-3 text-caption text-ink-soft" role="status">
          {draft.from ? t("table.pickEnd") : t("table.pickStart")}
        </p>
      </div>
    </div>
  );

  if (variant === "chip") {
    return (
      <Popover open={open} onOpenChange={(o) => (o ? show() : setOpen(false))}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={chipClass(active)}
          >
            <span className="truncate">{active ? activeLabel : field}</span>
            <ChevronDown size={14} strokeWidth={1.5} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-label={`${field}: ${t("table.rangeCalendar")}`}
          className="max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-16px)] overflow-auto p-0"
        >
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-caption text-ink-soft">{field}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={control}
            data-active={active}
            className="field-box flex min-h-11 w-full items-center gap-2 px-3"
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={fromText}
              placeholder={t("table.dateStart")}
              aria-label={`${field}: ${t("table.dateStart")}`}
              onChange={(e) =>
                setTyped({ from: e.target.value, to: toTextValue })
              }
              onFocus={show}
              onBlur={commitText}
              onKeyDown={(e) => e.key === "Enter" && commitText()}
              className={dateInput}
            />
            <ArrowRight
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className="shrink-0 text-ink-faint"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={toTextValue}
              placeholder={t("table.dateEnd")}
              aria-label={`${field}: ${t("table.dateEnd")}`}
              onChange={(e) => setTyped({ from: fromText, to: e.target.value })}
              onFocus={show}
              onBlur={commitText}
              onKeyDown={(e) => e.key === "Enter" && commitText()}
              className={dateInput}
            />
            <Hint label={t("table.rangeCalendar")}>
              <button
                ref={calendarButton}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={t("table.rangeCalendar")}
                onClick={() => (open ? setOpen(false) : show())}
                className="flex size-8 shrink-0 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface hover:text-ink"
              >
                <CalendarDays size={18} strokeWidth={1.5} aria-hidden />
              </button>
            </Hint>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-label={`${field}: ${t("table.rangeCalendar")}`}
          // Keep focus where the user is typing; clicks inside the field itself
          // are not "outside".
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => calendarButton.current?.focus()}
          onInteractOutside={(e) => {
            if (control.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className="max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-16px)] overflow-auto p-0"
        >
          {panel}
        </PopoverContent>
      </Popover>
    </div>
  );
}
