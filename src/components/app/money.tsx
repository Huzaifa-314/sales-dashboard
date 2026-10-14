// One shared component for all RM amounts: "RM 1,234.50", "-RM 100.00".
export function formatNumber(amount: number) {
  return Math.abs(amount).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMoney(amount: number) {
  return `${amount < 0 ? "-" : ""}RM ${formatNumber(amount)}`;
}

export function Money({
  amount,
  className = "",
  mono = false,
}: {
  amount: number;
  className?: string;
  // true: mono, for ledgers (Accountant Mode). Default: tabular figures in the
  // UI font, so every amount in the app looks the same.
  mono?: boolean;
}) {
  return (
    <span
      className={`${mono ? "amount" : "num"} ${amount < 0 ? "text-overdue" : ""} ${className}`}
    >
      {formatMoney(amount)}
    </span>
  );
}

// A money cell in a table: the figure, or a dash when it is zero, the same way in
// every column. Screen readers still hear the amount.
export function MoneyOrDash({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  if (amount === 0)
    return (
      <span className="text-body text-ink-faint">
        <span aria-hidden>–</span>
        <span className="sr-only">{formatMoney(0)}</span>
      </span>
    );
  return <Money mono={false} amount={amount} className={className} />;
}

// Hero figure: refined serif with a small "RM" prefix. Hero moments only.
export function HeroMoney({ amount }: { amount: number }) {
  return (
    <span
      className="t-hero font-serif"
      style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
    >
      <span className="t-prefix mr-1.5 text-ink-faint">RM</span>
      {formatNumber(amount)}
    </span>
  );
}
