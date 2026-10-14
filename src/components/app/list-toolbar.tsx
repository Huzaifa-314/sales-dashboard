"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FilterGrid, MoreFiltersChip } from "@/components/app/filter-bar";
import { useT } from "@/components/app/preferences";
import { SearchField } from "@/components/app/search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

// The row under a list's tabs. On desktop it is ONE row: search, then each
// filter as a small button (a filter that is on shows its value), then "More
// filters" for the rest, then the table's own buttons (Export, View) at the
// right. It wraps only on a narrow window. On a phone the same filters sit in
// a bottom sheet behind one Filters button. Every list uses this same row.
export function ListToolbar({
  search,
  filters,
  tools,
}: {
  search: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
  };
  filters?: {
    // How many filters are on in total (shown on the phone button).
    count: number;
    // How many of the "more" ones are on (shown on the More filters button).
    moreCount?: number;
    onReset: () => void;
    resetDisabled: boolean;
    // Desktop: one small button per main filter
    chips: ReactNode;
    // The full fields, for the phone sheet (main) and "More filters" (more)
    main: ReactNode;
    more?: ReactNode;
  };
  // Buttons for the table itself (Export, View)
  tools?: ReactNode;
}) {
  const t = useT();
  const desktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  // Focus the panel itself, not its first field: focusing the date field would
  // open the calendar over it as soon as the sheet opens.
  const focusPanel = (e: Event) => {
    e.preventDefault();
    (e.target as HTMLElement).focus();
  };

  const trigger = filters && (
    <Button
      variant="secondary"
      className="max-md:gap-1.5 max-md:px-3"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden />
      {t("table.filters")}
      {filters.count > 0 && (
        <Badge
          variant="solid"
          aria-label={t("table.filtersOn", { count: filters.count })}
        >
          {filters.count}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 lg:px-5">
      <SearchField
        {...search}
        className="min-w-0 flex-1 md:min-w-[190px] md:max-w-[260px]"
      />

      {filters && desktop && (
        <>
          {filters.chips}
          {filters.more && (
            <MoreFiltersChip count={filters.moreCount ?? 0}>
              {filters.more}
            </MoreFiltersChip>
          )}
        </>
      )}

      {filters && !desktop && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            side="bottom"
            closeLabel={t("common.close")}
            onOpenAutoFocus={focusPanel}
          >
            <SheetHeader>
              <SheetTitle>{t("table.filters")}</SheetTitle>
              <SheetDescription className="sr-only">
                {t("table.filtersHint")}
              </SheetDescription>
            </SheetHeader>
            <div className="grid max-h-[70dvh] gap-5 overflow-y-auto px-4 pb-5">
              <FilterGrid
                stacked
                main={filters.main}
                more={filters.more}
                moreCount={filters.moreCount}
              />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={filters.onReset}
                  disabled={filters.resetDisabled}
                >
                  {t("table.reset")}
                </Button>
                <Button onClick={() => setOpen(false)}>
                  {t("table.done")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {tools && <div className="ml-auto flex items-center gap-3">{tools}</div>}
    </div>
  );
}
