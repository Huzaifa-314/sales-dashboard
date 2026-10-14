import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, type Crumb } from "@/components/app/breadcrumb";

// Every page opens the same way: breadcrumb (or a small eyebrow on Home),
// title with an optional count, one line of context, and the page's actions.
export function PageHeader({
  title,
  count,
  countLabel,
  subtitle,
  eyebrow,
  crumbs,
  crumbsLabel,
  actions,
  titleAs: Title = "h1",
}: {
  title: string;
  count?: number;
  countLabel?: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  crumbs?: Crumb[];
  crumbsLabel?: string;
  actions?: ReactNode;
  // Only the design-system page needs anything but h1.
  titleAs?: "h1" | "h2";
}) {
  return (
    <header>
      {crumbs && crumbsLabel && (
        <Breadcrumb label={crumbsLabel} items={crumbs} />
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && <p className="micro mb-1">{eyebrow}</p>}
          <div className="flex items-center gap-3">
            <Title className="t-title">{title}</Title>
            {count !== undefined && (
              <Badge variant="outline" aria-label={countLabel}>
                {count}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-body text-ink-soft">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}
