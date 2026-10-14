"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Ellipsis } from "lucide-react";
import { AccountMenu } from "@/components/app/account-menu";
import { AskButton, AskPanel } from "@/components/app/ask-panel";
import { Breadcrumb, type Crumb } from "@/components/app/breadcrumb";
import { CreateMenu } from "@/components/app/create-menu";
import { useT } from "@/components/app/preferences";
import { GlobalSearch } from "@/components/app/global-search";
import { LogoMark } from "@/components/app/logo";
import { breadcrumbTrail, isActive, mobileNav } from "@/components/app/nav";
import { Sidebar } from "@/components/app/sidebar";

// Shared by the top bar and the page body so their edges always line up.
const CONTAINER = "w-full min-w-0 px-4 lg:px-8 xl:px-10";

const STORAGE_KEY = "invoispro:sidebar-collapsed";

// Collapsed state lives in localStorage (per-viewer convenience); storage may
// be unavailable, so every access is guarded and the default is expanded.
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

export function AppShell({
  children,
  crumb,
}: {
  children: ReactNode;
  // On a detail page: its own name as the last item of the breadcrumb
  // (Home › Contacts › Customers › Teo Chee Keong).
  crumb?: string | Crumb[];
}) {
  const pathname = usePathname();
  const t = useT();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  // The trail comes from the menu itself, so every page gets one (none on Home).
  const trail: Crumb[] = breadcrumbTrail(pathname).map((c) => ({
    label: t(c.label),
    href: c.href,
  }));
  if (crumb && trail.length > 0) {
    // The page above is now a parent, so it must be a link
    // A string is the page's own name; a list is several levels (a customer, Edit)
    trail.push(...(typeof crumb === "string" ? [{ label: crumb }] : crumb));
  }
  // A phone gets one "‹ parent" link instead of the whole trail
  const parent = [...trail.slice(0, -1)].reverse().find((c) => c.href);

  function toggle() {
    writeCollapsed(!collapsed);
  }

  return (
    <div
      className={`min-h-screen transition-[grid-template-columns] duration-150 ease-out lg:grid ${
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[248px_1fr]"
      }`}
    >
      {/* Out of the grid flow: it must not become a layout cell */}
      <nav aria-label={t("nav.skip")} className="absolute">
        <a
          href="#main"
          className="sr-only z-overlay rounded-control bg-primary px-4 py-2 text-body text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t("nav.skip")}
        </a>
      </nav>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <AskPanel />

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        {/* Top bar: search, create, account */}
        <header className="sticky top-0 z-header border-b border-line bg-surface">
          <div className={`${CONTAINER} flex h-14 items-center gap-2 sm:gap-3`}>
            {/* A phone has no room for the name: the mark alone, so Ask and New can both carry a word */}
            <span
              role="img"
              aria-label="SalesCRM"
              className="shrink-0 lg:hidden"
            >
              <LogoMark size={28} />
            </span>
            <GlobalSearch />
            <AskButton />
            <CreateMenu />
            <div className="-mr-1.5 shrink-0">
              <AccountMenu />
            </div>
          </div>
        </header>

        {/* The one page container: every page is centered and padded here */}
        <main
          id="main"
          tabIndex={-1}
          className={`${CONTAINER} flex-1 py-5 outline-none lg:py-6`}
        >
          {trail.length > 0 && (
            <div className="mb-3">
              <div className="max-md:hidden">
                <Breadcrumb
                  items={trail}
                  label={t("nav.breadcrumb")}
                  className=""
                />
              </div>
              {parent && (
                <Link
                  href={parent.href!}
                  className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-body text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink md:hidden"
                >
                  <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
                  {parent.label}
                </Link>
              )}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile bottom bar: four destinations and More */}
      <nav
        aria-label={t("nav.workspace")}
        className="fixed inset-x-0 bottom-0 z-header grid grid-cols-5 border-t border-line bg-surface lg:hidden"
      >
        {[
          ...mobileNav,
          { href: "/more", label: "nav.more" as const, icon: Ellipsis },
        ].map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-caption ${
                active ? "font-medium text-ink" : "text-ink-soft"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-4 top-0 h-0.5 bg-brass"
                />
              )}
              <item.icon size={20} strokeWidth={1.5} aria-hidden />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
