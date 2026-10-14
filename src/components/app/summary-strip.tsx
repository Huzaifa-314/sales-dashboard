import type { ReactNode } from "react";

// A list's headline figures on ONE line, above the tabs: "To collect RM 95,180.00
// · Overdue RM 24,760.00 …  as at 8 Oct 2026". Summary only: the tabs below do
// the filtering, so nothing here is clickable. It wraps to two lines on a phone.
export function SummaryStrip({
  label,
  items,
  asAt,
}: {
  label: string;
  items: { label: string; value: ReactNode; danger?: boolean }[];
  asAt?: string;
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-card border border-line bg-surface px-5 py-3"
    >
      {items.map((i) => (
        <p key={i.label} className="flex items-baseline gap-2">
          <span className="micro">{i.label}</span>
          <span
            className={`num text-body font-semibold ${i.danger ? "text-overdue" : "text-ink"}`}
          >
            {i.value}
          </span>
        </p>
      ))}
      {asAt && (
        <p className="num ml-auto text-caption text-ink-faint">{asAt}</p>
      )}
    </section>
  );
}
