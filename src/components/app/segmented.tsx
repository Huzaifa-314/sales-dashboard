"use client";

import type { ReactNode } from "react";
import { Hint } from "@/components/app/hint";

// One look for every segmented control (filters, theme switch, density).
export function segmentClass(active: boolean) {
  return `flex min-h-9 items-center justify-center gap-2 rounded-chip px-3 text-caption whitespace-nowrap transition-colors duration-150 ${
    active
      ? "bg-surface font-medium text-ink shadow-ring"
      : "text-ink-soft hover:text-ink"
  }`;
}

export type SegmentOption<T extends string> = {
  id: T;
  label: ReactNode;
  // Small trailing number, e.g. a count.
  badge?: ReactNode;
  // Accessible name when `label` is only an icon.
  ariaLabel?: string;
  // Tooltip for an icon-only option.
  hint?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex gap-1 rounded-control bg-surface-2 p-1 ${className}`}
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Hint key={o.id} label={o.hint}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={o.ariaLabel}
              onClick={() => onChange(o.id)}
              className={segmentClass(on)}
            >
              {o.label}
              {o.badge !== undefined && (
                <span
                  className={`num text-caption ${on ? "text-ink-soft" : "text-ink-faint"}`}
                >
                  {o.badge}
                </span>
              )}
            </button>
          </Hint>
        );
      })}
    </div>
  );
}
