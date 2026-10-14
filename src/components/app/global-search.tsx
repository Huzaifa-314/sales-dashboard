"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { Hint } from "@/components/app/hint";
import { formatMoney } from "@/components/app/money";
import { allNavItems } from "@/components/app/nav";
import { useT } from "@/components/app/preferences";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Lead } from "@/lib/crm/types.ts";

const noopSubscribe = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

// One search for the whole app, always one keystroke away (⌘K / Ctrl K): jump
// to any CRM page, or straight to a lead / prospect. On a phone it is an icon in the top bar.
export function GlobalSearch() {
  const t = useT();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const mac = useSyncExternalStore(noopSubscribe, isMac, () => false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch leads when search palette is opened
  useEffect(() => {
    if (open) {
      fetch("/api/crm/leads")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.leads) {
            setLeads(data.leads);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function change(next: boolean) {
    setOpen(next);
    if (!next) setQ("");
  }

  // Substring matching for pages and CRM leads
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const shownPages = needle
    ? allNavItems.filter((i) => t(i.label).toLowerCase().includes(needle))
    : allNavItems;
  const shownLeads = needle
    ? leads.filter(
        (l) =>
          l.company.toLowerCase().includes(needle) ||
          l.contact?.toLowerCase().includes(needle) ||
          l.email?.toLowerCase().includes(needle) ||
          l.city?.toLowerCase().includes(needle) ||
          (digits.length > 0 && !!l.phone?.replace(/\D/g, "").includes(digits)),
      )
    : leads.slice(0, 5);

  return (
    <>
      <div className="min-w-0 flex-1 max-md:flex max-md:min-w-11 max-md:justify-end">
        {/* md and up: looks like a field, opens the palette */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="field-box hidden min-h-10 w-full max-w-md items-center gap-2.5 px-3 text-left md:flex"
        >
          <Search
            size={18}
            strokeWidth={1.5}
            aria-hidden
            className="shrink-0 text-ink-faint"
          />
          <span className="min-w-0 flex-1 truncate text-body text-ink-faint">
            {t("search.trigger")}
          </span>
          <kbd className="hidden rounded border border-field-border px-1.5 font-mono text-micro text-ink-soft lg:block">
            {mac ? "⌘ K" : "Ctrl K"}
          </kbd>
        </button>
        {/* phones: an icon */}
        <Hint label={t("search.trigger")}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={t("search.trigger")}
            className="flex size-11 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink md:hidden"
          >
            <Search size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </Hint>
      </div>

      <CommandDialog
        open={open}
        onOpenChange={change}
        shouldFilter={false}
        title={t("search.title")}
        description={t("search.description")}
      >
        <CommandInput
          value={q}
          onValueChange={setQ}
          placeholder={t("search.trigger")}
        />
        <CommandList className="max-h-[min(60vh,420px)]">
          <CommandEmpty>{t("search.empty")}</CommandEmpty>
          {shownPages.length > 0 && (
            <CommandGroup heading={t("search.pages")}>
              {shownPages.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`page ${t(item.label)}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                    className="text-ink-soft"
                  />
                  <span className="flex-1">{t(item.label)}</span>
                  {item.soon && (
                    <Badge className="!text-micro">{t("nav.soon")}</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {shownLeads.length > 0 && (
            <CommandGroup heading={t("search.leads")}>
              {shownLeads.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`lead ${l.company} ${l.contact || ""} ${l.id}`}
                  keywords={[l.company, l.contact ?? "", l.phone ?? "", l.email ?? ""]}
                  onSelect={() => go(`/leads?search=${encodeURIComponent(l.company)}`)}
                >
                  <Avatar name={l.company} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-body font-medium text-ink">
                        {l.company}
                      </span>
                      <span className="shrink-0 text-caption text-ink-soft font-mono">
                        {formatMoney(l.mrr || l.value || 0)}/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-caption text-ink-soft">
                      {l.contact && <span className="truncate">{l.contact}</span>}
                      {l.stage && (
                        <span className="rounded bg-surface-2 px-1 text-micro text-ink-faint">
                          {l.stage}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-caption text-ink-soft">
          <CornerDownLeft size={14} strokeWidth={1.5} aria-hidden />
          {t("search.hints")}
        </div>
      </CommandDialog>
    </>
  );
}
