import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  // Heading level: pages with no h2 above pass "h2" (or "h1" when it is the
  // page's only heading) so levels never skip.
  as?: "h1" | "h2" | "h3";
};

// Short explanation and one action. Serif headline is allowed for empty states.
export function EmptyState({
  title,
  description,
  action,
  as: Heading = "h3",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-1 px-5 py-10 sm:items-center sm:text-center">
      <span aria-hidden className="mb-3 h-0.5 w-8 bg-brass" />
      <Heading className="font-serif t-empty text-ink">{title}</Heading>
      <p className="max-w-sm text-body text-ink-soft">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
