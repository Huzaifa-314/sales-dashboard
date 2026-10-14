"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Hint } from "@/components/app/hint";
import { useT } from "@/components/app/preferences";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1 … 4 5 6 … 12 — always first, last and the neighbours of the current page.
function pageItems(current: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, current - 1, current, current + 1]);
  const nums = [...keep]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const nav =
  "flex size-11 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:text-ink-faint disabled:opacity-40 lg:size-10";

export function Pagination({
  page,
  pageSize,
  total,
  sizes,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  sizes: number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const t = useT();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label={t("cust.pagination")}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line px-4 py-2 lg:px-5"
    >
      <div className="flex items-center gap-4 max-md:hidden">
        <p className="num text-caption text-ink-soft" aria-live="polite">
          {t("cust.range", { from, to, total })}
        </p>
        <div className="flex items-center gap-2 text-caption text-ink-soft">
          {t("cust.rowsPerPage")}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSize(Number(v))}
          >
            <SelectTrigger
              size="sm"
              aria-label={t("cust.rowsPerPage")}
              className="num w-[72px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {sizes.map((s) => (
                <SelectItem key={s} value={String(s)} className="num">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="num text-caption text-ink-soft md:hidden">
        {t("cust.pageOf", { page, pages })}
      </p>

      <div className="flex items-center gap-1 max-md:ml-auto">
        <Hint label={t("cust.prev")}>
          <button
            type="button"
            className={nav}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label={t("cust.prev")}
          >
            <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </Hint>
        <ul className="flex items-center gap-1 max-md:hidden">
          {pageItems(page, pages).map((item, i) =>
            item === "gap" ? (
              <li
                key={`gap-${i}`}
                aria-hidden
                className="w-6 text-center text-ink-faint"
              >
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPage(item)}
                  aria-label={t("cust.goToPage", { page: item })}
                  aria-current={item === page ? "page" : undefined}
                  className={`num flex size-10 items-center justify-center rounded-control text-caption transition-colors duration-150 ${
                    item === page
                      ? "bg-primary font-medium text-on-primary"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>
        <Hint label={t("cust.next")}>
          <button
            type="button"
            className={nav}
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            aria-label={t("cust.next")}
          >
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </Hint>
      </div>
    </nav>
  );
}
