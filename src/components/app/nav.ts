import {
  Banknote,
  BookOpenText,
  Boxes,
  CalendarClock,
  CalendarSync,
  ChartColumn,
  ClipboardList,
  Coins,
  Contact,
  CreditCard,
  FileDiff,
  FileText,
  Files,
  FolderKanban,
  GitCompareArrows,
  HandCoins,
  Home,
  Landmark,
  Package,
  ReceiptText,
  Repeat,
  ScrollText,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Bot,
  History,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/i18n/messages";

export type NavItem = {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  soon?: boolean;
  children?: NavItem[];
  badge?: "overdue";
};

const home: NavItem = { href: "/", label: "nav.home", icon: Home };
const ai: NavItem = { href: "/ai", label: "nav.ai", icon: Bot };

// Real Sales CRM Routes
const pipeline: NavItem = { href: "/pipeline", label: "nav.pipeline", icon: FolderKanban };
const leads: NavItem = { href: "/leads", label: "nav.leads", icon: Users };
const tasks: NavItem = { href: "/tasks", label: "nav.tasks", icon: CalendarClock };
const targets: NavItem = { href: "/targets", label: "nav.targets", icon: TrendingUp };
const activities: NavItem = { href: "/activities", label: "nav.activities", icon: History };

// Contacts
const customers: NavItem = {
  href: "/customers",
  label: "nav.customers",
  icon: Users,
};
const suppliers: NavItem = {
  href: "/suppliers",
  label: "nav.suppliers",
  icon: Store,
};

// Sales
const quotations: NavItem = {
  href: "/sales/quotations",
  label: "nav.quotations",
  icon: ClipboardList,
  soon: true,
};
const projects: NavItem = {
  href: "/sales/projects",
  label: "nav.projects",
  icon: FolderKanban,
  soon: true,
};
const invoices: NavItem = {
  href: "/sales/invoices",
  label: "nav.invoices",
  icon: FileText,
  soon: true,
};
const recurring: NavItem = {
  href: "/sales/recurring",
  label: "nav.recurring",
  icon: Repeat,
  soon: true,
};
const adjustments: NavItem = {
  href: "/sales/adjustments",
  label: "nav.adjustments",
  icon: FileDiff,
  soon: true,
};
const payments: NavItem = {
  href: "/collections/payments",
  label: "nav.payments",
  icon: HandCoins,
  soon: true,
};
const receipts: NavItem = {
  href: "/collections/receipts",
  label: "nav.receipts",
  icon: ReceiptText,
  soon: true,
};

// Collections: getting paid is the product's main promise, so it is its own
// folder, and the folder row carries the number of customers who are late.
const outstanding: NavItem = {
  href: "/collections/outstanding",
  label: "nav.outstanding",
  icon: CalendarClock,
  soon: true,
};

// Purchases
const bills: NavItem = {
  href: "/buy/bills",
  label: "nav.bills",
  icon: ScrollText,
  soon: true,
};
const paymentsMade: NavItem = {
  href: "/buy/payments",
  label: "nav.paymentsMade",
  icon: Banknote,
  soon: true,
};
const expenses: NavItem = {
  href: "/expenses",
  label: "nav.expenses",
  icon: CreditCard,
  soon: true,
};
const recurringExpenses: NavItem = {
  href: "/buy/recurring",
  label: "nav.recurringExpenses",
  icon: CalendarSync,
  soon: true,
};

// Documents: receipts, bills and attachments. New uploads wait here under
// "To review" until they become an expense or a bill.
const documents: NavItem = {
  href: "/documents",
  label: "nav.documents",
  icon: Files,
  soon: true,
};

// Banking
const money: NavItem = {
  href: "/banking/accounts",
  label: "nav.money",
  icon: Landmark,
  soon: true,
};
const reconcile: NavItem = {
  href: "/banking/reconciliation",
  label: "nav.reconcile",
  icon: GitCompareArrows,
  soon: true,
};

// Products
const products: NavItem = {
  href: "/products",
  label: "nav.products",
  icon: Package,
  soon: true,
};
const inventory: NavItem = {
  href: "/inventory",
  label: "nav.inventory",
  icon: Boxes,
  soon: true,
};

// Reports and the books
const rSales: NavItem = {
  href: "/reports/sales",
  label: "nav.rSales",
  icon: ChartColumn,
  soon: true,
};
const reportPages: NavItem[] = [
  rSales,
  ...(
    [
      ["/reports/customers", "nav.rCustomers"],
      ["/reports/products", "nav.rProducts"],
      ["/reports/quotations", "nav.rQuotations"],
      ["/reports/receivables", "nav.rReceivables"],
      ["/reports/payables", "nav.rPayables"],
      ["/reports/expenses", "nav.rExpenses"],
      ["/reports/payment-methods", "nav.rPaymentMethods"],
      ["/reports/tax", "nav.rTax"],
    ] as [string, MessageKey][]
  ).map(([href, label]) => ({
    href,
    label,
    icon: ChartColumn,
    soon: true,
  })),
];
const bookPages: NavItem[] = (
  [
    ["/accounting/accounts", "nav.aAccounts"],
    ["/accounting/journals", "nav.aJournals"],
    ["/accounting/ledger", "nav.aLedger"],
    ["/accounting/trial-balance", "nav.aTrial"],
    ["/accounting/profit-loss", "nav.aProfit"],
    ["/accounting/balance-sheet", "nav.aBalance"],
    ["/accounting/cash-flow", "nav.aCash"],
    ["/accounting/opening-balances", "nav.aOpening"],
    ["/accounting/period-lock", "nav.aLock"],
    ["/accounting/review", "nav.aReview"],
    ["/accounting/audit-trail", "nav.aAudit"],
  ] as [string, MessageKey][]
).map(([href, label]) => ({ href, label, icon: BookOpenText, soon: true }));

const folder = (
  label: MessageKey,
  icon: LucideIcon,
  children: NavItem[],
  badge?: NavItem["badge"],
): NavItem => ({
  href: children[0].href,
  label,
  icon,
  soon: children.every((c) => c.soon),
  children,
  badge,
});

export const settingsNav: NavItem = {
  href: "/settings",
  label: "nav.settings",
  icon: Settings,
};

export const navZones: NavItem[][] = [
  [home, ai],
  [
    pipeline,
    leads,
    tasks,
    targets,
    activities,
  ],
];

// Tabs on mobile
export const mobileNav: NavItem[] = [home, pipeline, leads, tasks, ai];

// Top-level destinations in order (folders included), then Settings.
export const topLevelNav: NavItem[] = [...navZones.flat(), settingsNav];

// Every real page: folders hold none, so only their pages count. Used for
// search and to decide which paths get a "coming soon" page.
export const allNavItems: NavItem[] = topLevelNav.flatMap(
  (i) => i.children ?? [i],
);

export const navItemFor = (href: string) =>
  allNavItems.find((i) => i.href === href);

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// A folder is "inside" when one of its pages is the current page.
export const folderHasActive = (item: NavItem, pathname: string) =>
  (item.children ?? []).some((c) => isActive(pathname, c.href));

// The trail above a page title: Home, the folder it lives in (plain text, a
// folder has no page), then the page. A detail page (a customer) lands on its
// list's address, so the list is linked and the page adds its own last item.
export type TrailItem = { label: MessageKey; href?: string };

export function breadcrumbTrail(pathname: string): TrailItem[] {
  if (pathname === "/") return [];
  let best: { item: NavItem; folder?: NavItem } | undefined;
  for (const top of topLevelNav) {
    for (const leaf of top.children ?? [top]) {
      if (!isActive(pathname, leaf.href)) continue;
      if (!best || leaf.href.length > best.item.href.length) {
        best = { item: leaf, folder: top.children ? top : undefined };
      }
    }
  }
  if (!best) return [];
  const exact = pathname === best.item.href;
  return [
    { label: "nav.home", href: "/" },
    ...(best.folder ? [{ label: best.folder.label }] : []),
    { label: best.item.label, href: exact ? undefined : best.item.href },
  ];
}
