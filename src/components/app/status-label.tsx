export type Tone =
  "overdue" | "owing" | "credit" | "settled" | "partly" | "paid";

// One shape for every status: a stamp, like PAID or OVERDUE on a ledger. A 1px
// outline, square 4px corners, small capitals, no fill. Colour means "needs
// attention", so only the exceptions carry it: red for overdue, amber for partly
// paid. The normal states stay neutral so the red ones stand out: ink for
// owing (the usual state) and for credit, a quieter grey for settled. Paid is
// green. The label always carries the meaning; colour only supports it.
const tones: Record<Tone, string> = {
  overdue: "text-overdue",
  owing: "text-ink",
  credit: "text-ink",
  partly: "text-partly",
  paid: "text-paid",
  settled: "text-ink-faint",
};

export function StatusLabel({
  tone,
  label,
  detail,
}: {
  tone: Tone;
  label: string;
  // A quiet second line with the fact behind the status ("29 days late").
  detail?: string;
}) {
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-chip border border-current px-2 text-micro font-semibold uppercase tracking-micro ${tones[tone]}`}
      >
        {label}
      </span>
      {detail && (
        <span className="num text-caption whitespace-nowrap text-ink-soft">
          {detail}
        </span>
      )}
    </span>
  );
}
