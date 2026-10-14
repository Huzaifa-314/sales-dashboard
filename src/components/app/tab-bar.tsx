"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  // Small count chip after the label.
  badge?: ReactNode;
};

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

// The one tab bar: text tabs, a 2px brass underline on the active one, a count
// chip, arrow-key navigation. Used by the dashboard (tabs with their own
// panels) and by list pages (tabs that filter one list).
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
  hasPanels = true,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idPrefix: string;
  // False when the tabs only filter a list and no tabpanel carries their id.
  hasPanels?: boolean;
}) {
  // On a phone the tabs scroll sideways; fade the right edge while more are
  // hidden, so it is clear there is more.
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setFade(
        el.scrollWidth > el.clientWidth + 1 &&
          el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      );
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [tabs.length]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === value);
    const go = (n: number) => {
      e.preventDefault();
      const next = tabs[(n + tabs.length) % tabs.length];
      onChange(next.id);
      document.getElementById(tabId(idPrefix, next.id))?.focus();
    };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
  }

  return (
    <div
      ref={ref}
      data-fade={fade}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="tab-fade flex gap-2 overflow-x-auto border-b border-line px-2 [scrollbar-width:none] lg:px-3 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={tabId(idPrefix, t.id)}
            aria-selected={selected}
            aria-controls={hasPanels ? panelId(idPrefix, t.id) : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`-mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-2 text-body whitespace-nowrap transition-colors duration-150 ${
              selected
                ? "border-brass font-medium text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {t.badge !== undefined && (
              <Badge variant={selected ? "solid" : "soft"}>{t.badge}</Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
