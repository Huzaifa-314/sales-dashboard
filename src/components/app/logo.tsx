// Temporary mark until the brand design is done: a rounded square in the primary
// colour with a bold "P" built from one stroke, and a short ledger rule under
// the bowl. Single colour pair, so it follows light and dark mode, and stays
// legible at 16px. The favicon (app/icon.svg) is the same drawing.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="shrink-0"
    >
      <rect width="36" height="36" rx="9" fill="var(--primary)" />
      <path
        d="M12.5 27V9h8.5a5.25 5.25 0 0 1 0 10.5H12.5"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="20"
        y="24"
        width="7"
        height="3"
        rx="1.5"
        fill="var(--on-primary)"
        fillOpacity="0.7"
      />
    </svg>
  );
}

export function Wordmark({
  endorsement = false,
  size = 36,
}: {
  endorsement?: boolean;
  size?: number;
}) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} />
      <span className="flex flex-col">
        <span className="t-wordmark text-ink font-bold tracking-tight">SalesPro CRM</span>
        {endorsement && (
          <span className="mt-0.5 text-caption text-ink-soft">
            by Infinita Tech Solutions
          </span>
        )}
      </span>
    </span>
  );
}
