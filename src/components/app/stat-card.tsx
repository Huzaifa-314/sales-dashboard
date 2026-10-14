import type { ReactNode } from "react";
import { Hint } from "@/components/app/hint";
import { formatNumber } from "@/components/app/money";

// Figure in the UI font: small "RM" prefix, large tabular number.
export function Figure({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  return (
    <p className={`num t-stat ${className}`}>
      <span className="t-prefix mr-1.5 text-ink-faint">RM</span>
      {formatNumber(amount)}
    </p>
  );
}

// One cell of a KPI band. With `onSelect` the whole cell is a button, so the
// summary doubles as a filter.
export function Stat({
  label,
  children,
  onSelect,
  active = false,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onSelect?: () => void;
  active?: boolean;
  hint?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="micro">{label}</p>
      {children}
    </>
  );
  const pad = "p-4 md:p-5 lg:p-6";
  if (!onSelect) return <div className={`${pad} ${className}`}>{body}</div>;
  return (
    <Hint label={hint}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`${pad} flex w-full flex-col items-stretch justify-start text-left transition-colors duration-150 hover:bg-surface-2/60 ${
          active ? "bg-surface-2" : ""
        } ${className}`}
      >
        {body}
      </button>
    </Hint>
  );
}

// A single card with hairline dividers between its stats.
export function KpiBand({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="grid grid-cols-2 overflow-hidden rounded-card border border-line bg-surface md:grid-cols-3 [&>*]:border-line max-md:[&>*:first-child]:col-span-2 max-md:[&>*:first-child]:border-b max-md:[&>*:nth-child(3)]:border-l md:[&>*:nth-child(n+2)]:border-l"
    >
      {children}
    </section>
  );
}
