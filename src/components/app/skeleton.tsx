import { Card } from "@/components/app/card";

// Placeholder block. Motion is dropped for reduced-motion users globally.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`brass-dot-pulse rounded-control bg-surface-2 ${className}`}
    />
  );
}

// Loading state for list pages: KPI band + toolbar + rows, same footprint as
// the real thing so nothing jumps when data arrives.
export function ListSkeleton({
  label,
  rows = 8,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-5 h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <Card className="mt-6 grid grid-cols-1 gap-6 p-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-7 w-36" />
            <Skeleton className="mt-4 h-3 w-44" />
          </div>
        ))}
      </Card>
      <Card className="mt-6">
        <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-line px-5">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="hidden h-11 w-[340px] lg:block" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex h-[68px] items-center gap-3 border-b border-line px-5 last:border-b-0"
          >
            <Skeleton className="size-10 shrink-0 !rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
            <Skeleton className="hidden h-6 w-24 md:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
