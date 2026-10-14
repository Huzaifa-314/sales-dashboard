"use client";

import { SlidersHorizontal } from "lucide-react";
import type { Column, Density } from "@/components/app/data-table";
import { Hint } from "@/components/app/hint";
import { useT } from "@/components/app/preferences";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// "View": which columns the table shows and how tall its rows are, in one menu
// (it used to be a Columns button and two small icons). Choices apply at once
// and are remembered per table. Hidden on phones, where rows are a list.
export function ViewMenu<T>({
  columns,
  isShown,
  onToggle,
  onReset,
  customized,
  density,
  onDensity,
}: {
  columns: Column<T>[];
  isShown: (id: string) => boolean;
  onToggle: (id: string, on: boolean) => void;
  onReset: () => void;
  customized: boolean;
  density: Density;
  onDensity: (d: Density) => void;
}) {
  const t = useT();
  const choices = columns.filter((c) => !c.locked);
  const on = choices.filter((c) => isShown(c.id)).length;
  const row =
    "flex min-h-10 cursor-pointer items-center gap-3 rounded-control px-2 text-body text-ink transition-colors duration-150 hover:bg-surface-2";
  return (
    <Popover>
      <Hint label={t("table.viewHint")}>
        <PopoverTrigger asChild>
          <Button variant="secondary" className="max-md:hidden">
            <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden />
            {t("table.view")}
          </Button>
        </PopoverTrigger>
      </Hint>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="max-h-(--radix-popover-content-available-height) w-64 overflow-y-auto p-2"
      >
        <div className="border-b border-line pb-2">
          <p className="px-2 pb-1 text-caption text-ink-soft">
            {t("table.rowHeight")}
          </p>
          <div
            role="group"
            aria-label={t("table.rowHeight")}
            className="flex gap-1 px-1 pb-1"
          >
            {(
              [
                ["comfortable", "table.rowComfortable"],
                ["compact", "table.rowCompact"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={density === value}
                onClick={() => onDensity(value)}
                className={cn(
                  "min-h-10 flex-1 rounded-control border px-2 text-caption transition-colors duration-150",
                  density === value
                    ? "border-primary bg-surface-2 font-medium text-ink"
                    : "border-line text-ink-soft hover:bg-surface-2",
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <p className="px-2 pb-1 pt-2 text-caption text-ink-soft">
          {t("table.columns")} ·{" "}
          {t("table.columnsShown", { shown: on, total: choices.length })}
        </p>
        <ul>
          {choices.map((c) => (
            <li key={c.id}>
              <label className={row}>
                <Checkbox
                  checked={isShown(c.id)}
                  onCheckedChange={(v) => onToggle(c.id, v === true)}
                />
                {c.header}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!customized}
          >
            {t("table.columnsReset")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
