import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

// Home › Customers. The last item is the current page.
export function Breadcrumb({
  items,
  label,
  className = "mb-4",
}: {
  items: Crumb[];
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-soft">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-control px-1 py-0.5 transition-colors duration-150 hover:text-ink hover:underline hover:underline-offset-4"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "px-1 font-medium text-ink" : "px-1"}
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  aria-hidden
                  className="text-ink-faint"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
