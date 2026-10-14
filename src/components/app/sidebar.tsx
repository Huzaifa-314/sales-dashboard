"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Hint } from "@/components/app/hint";
import { LogoMark, Wordmark } from "@/components/app/logo";
import {
  folderHasActive,
  isActive,
  navZones,
  settingsNav,
  type NavItem,
} from "@/components/app/nav";
import { useT } from "@/components/app/preferences";
import { useCustomers } from "@/lib/customers-store";
import { useNavFolds } from "@/lib/nav-folds";

const INFINITA_URL = "https://www.infinitatech.com";

const rowBase =
  "group relative flex min-h-9 w-full items-center rounded-control text-body transition-colors duration-150";

function rowTone(active: boolean) {
  return active
    ? "bg-surface-2 font-medium text-ink"
    : "text-ink-soft hover:bg-surface-2 hover:text-ink";
}

function ActiveBar() {
  return (
    <span
      aria-hidden
      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brass"
    />
  );
}

// Unbuilt pages say "Soon" on hover or focus (and always to screen readers).
// Laid over the end of the row, so it never takes room from the label.
function SoonTag({ show }: { show: boolean }) {
  const t = useT();
  if (!show) return null;
  return (
    <>
      <span className="sr-only">, {t("nav.soon")}</span>
      <span
        aria-hidden
        className="absolute right-3 rounded-chip bg-surface-2 px-1 text-micro text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {t("nav.soon")}
      </span>
    </>
  );
}

// The number of customers who are late, live from the same data as Customers.
function OverdueBadge() {
  const t = useT();
  const count = useCustomers().filter((c) => c.overdue > 0).length;
  if (count === 0) return null;
  return (
    <span
      className="num min-w-5 rounded-full bg-primary px-1.5 text-center text-micro font-semibold leading-5 text-on-primary"
      aria-label={t("nav.overdueCount", { count })}
    >
      {count}
    </span>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  nested = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  // A page inside a folder: no icon, indented by its folder.
  nested?: boolean;
}) {
  const t = useT();
  const label = t(item.label);
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Hint
      label={item.soon ? `${label} · ${t("nav.soon")}` : label}
      side="right"
      disabled={!collapsed}
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`${rowBase} ${
          collapsed ? "justify-center" : nested ? "gap-2 px-3" : "gap-3 px-3"
        } ${rowTone(active)}`}
      >
        {active && !nested && <ActiveBar />}
        {!nested && (
          <Icon
            size={20}
            strokeWidth={1.5}
            aria-hidden
            className={
              active ? "text-ink" : "text-ink-faint group-hover:text-ink"
            }
          />
        )}
        <span
          className={
            collapsed ? "sr-only" : "min-w-0 flex-1 truncate text-left"
          }
        >
          {label}
        </span>
        {!collapsed && item.badge === "overdue" && <OverdueBadge />}
        <SoonTag show={!!item.soon && !collapsed && !item.badge} />
        {collapsed && item.badge === "overdue" && (
          <span className="sr-only">
            <OverdueBadge />
          </span>
        )}
      </Link>
    </Hint>
  );
}

// A folder (Sales, Purchases, Reports…): the row folds its pages under it.
// Folded by default and remembered; open by itself when the current page is
// inside. In the icon rail it is a plain icon that goes to its first page.
function SidebarFolder({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const t = useT();
  const folds = useNavFolds();
  const children = item.children ?? [];
  const inside = folderHasActive(item, pathname);
  const key = `folder:${item.label}`;
  const open = folds.chosen(key) ?? inside;
  const label = t(item.label);
  const listId = `nav-${item.label.replace(/\W/g, "")}`;
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Hint label={label} side="right">
        <Link
          href={item.href}
          aria-label={label}
          aria-current={inside ? "true" : undefined}
          className={`${rowBase} justify-center ${rowTone(inside)}`}
        >
          {inside && <ActiveBar />}
          <Icon
            size={20}
            strokeWidth={1.5}
            aria-hidden
            className={
              inside ? "text-ink" : "text-ink-faint group-hover:text-ink"
            }
          />
        </Link>
      </Hint>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => folds.set(key, !open)}
        className={`${rowBase} gap-3 px-3 text-left ${
          inside ? "font-medium text-ink hover:bg-surface-2" : rowTone(false)
        }`}
      >
        <Icon
          size={20}
          strokeWidth={1.5}
          aria-hidden
          className={
            inside ? "text-ink" : "text-ink-faint group-hover:text-ink"
          }
        />
        <span className="flex-1 truncate">{label}</span>
        {/* The count stays visible while the folder is folded */}
        {!open && item.badge === "overdue" && <OverdueBadge />}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className={`text-ink-faint transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && (
        <ul
          id={listId}
          className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2"
        >
          {children.map((c) => (
            <li key={c.href}>
              <SidebarLink
                item={c}
                pathname={pathname}
                collapsed={false}
                nested
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Three zones with a thin line between them: Home and AI, the daily work, and
// the books. The folders do the job group headings used to.
function MainNav({
  pathname,
  collapsed,
}: {
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <>
      {navZones.map((zone, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {i > 0 && <hr className="mx-3 mb-2 border-line" />}
          {zone.map((item) =>
            item.children ? (
              <SidebarFolder
                key={item.label}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ) : (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ),
          )}
        </div>
      ))}
    </>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const nav = useRef<HTMLElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  // Keep the current page in view, and show a soft fade while the menu has
  // more below it (the scrollbar alone is easy to miss).
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    // Folders remembered as open expand just after load and push the current
    // page down, so look again once they have settled.
    const reveal = () =>
      el.querySelector('[aria-current="page"]')?.scrollIntoView({
        block: "nearest",
      });
    reveal();
    const later = setTimeout(reveal, 150);
    const measure = () =>
      setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      clearTimeout(later);
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [pathname, collapsed]);

  const toggle = (
    <Hint
      label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
      side={collapsed ? "right" : "bottom"}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
        className="group relative flex size-11 shrink-0 items-center justify-center rounded-control text-ink-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        {collapsed ? (
          <PanelLeftOpen size={20} strokeWidth={1.5} aria-hidden />
        ) : (
          <PanelLeftClose size={20} strokeWidth={1.5} aria-hidden />
        )}
      </button>
    </Hint>
  );

  return (
    <aside
      className={`sticky top-0 hidden h-screen flex-col border-r border-line bg-surface py-5 lg:flex ${
        collapsed ? "items-stretch px-3" : "px-4"
      }`}
    >
      {/* Brand + collapse */}
      <div
        className={`flex ${
          collapsed
            ? "flex-col items-center gap-3"
            : "items-center justify-between pl-2"
        }`}
      >
        {collapsed ? (
          <span role="img" aria-label="InvoisPro">
            <LogoMark />
          </span>
        ) : (
          <Wordmark />
        )}
        {toggle}
      </div>

      {/* Company: one quiet line (a box is only worth its space with several) */}
      <Hint label={t("sidebar.company")} side="right" disabled={!collapsed}>
        <button
          type="button"
          className={`group mt-2 flex min-h-10 items-center rounded-control text-left transition-colors duration-150 hover:bg-surface-2 ${
            collapsed ? "justify-center" : "gap-2.5 px-2"
          }`}
        >
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-chip bg-surface-2 text-micro font-semibold text-ink group-hover:bg-surface"
          >
            {t("sidebar.company").charAt(0)}
          </span>
          {collapsed ? (
            <span className="sr-only">
              {t("sidebar.company")}. {t("sidebar.switchCompany")}
            </span>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">
                {t("sidebar.company")}
                <span className="sr-only">. {t("sidebar.switchCompany")}</span>
              </span>
              <ChevronsUpDown
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className="text-ink-faint"
              />
            </>
          )}
        </button>
      </Hint>

      {/* Navigation */}
      <div className="relative mt-3 min-h-0 flex-1">
        <nav
          ref={nav}
          aria-label={t("nav.workspace")}
          className={`flex h-full scroll-pb-12 flex-col gap-3 pb-3 ${
            collapsed
              ? "overflow-y-auto [scrollbar-width:none]"
              : "-mx-1 overflow-y-auto px-1 [scrollbar-color:var(--line)_transparent] [scrollbar-width:thin]"
          }`}
        >
          <MainNav pathname={pathname} collapsed={collapsed} />
        </nav>
        {moreBelow && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-surface to-transparent"
          />
        )}
      </div>

      {/* Settings, pinned to the bottom, then the one-line credit */}
      <div className="flex flex-col gap-1 border-t border-line pt-3">
        <SidebarLink
          item={settingsNav}
          pathname={pathname}
          collapsed={collapsed}
        />
        {collapsed ? (
          <Hint label="Infinita Tech Solutions Sdn Bhd" side="right">
            <a
              href={INFINITA_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("sidebar.infinitaLabel")}
              className="flex min-h-9 items-center justify-center rounded-control text-ink-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              <ExternalLink size={18} strokeWidth={1.5} aria-hidden />
            </a>
          </Hint>
        ) : (
          <a
            href={INFINITA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("sidebar.by")} ${t("sidebar.infinitaLabel")}`}
            className="flex min-h-9 items-center justify-between gap-2 rounded-control px-3 text-micro text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <span className="truncate">
              {t("sidebar.by")} Infinita Tech Solutions
            </span>
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
          </a>
        )}
      </div>
    </aside>
  );
}
