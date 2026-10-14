"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Download,
  Eye,
  FilePlus2,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { Section } from "@/components/app/card";
import { Checkbox } from "@/components/app/checkbox";
import { DataTable, type Column } from "@/components/app/data-table";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Menu } from "@/components/app/menu";
import { HeroMoney, Money } from "@/components/app/money";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { SearchField } from "@/components/app/search-field";
import { Segmented } from "@/components/app/segmented";
import { ListSkeleton, Skeleton } from "@/components/app/skeleton";
import { Figure, KpiBand, Stat } from "@/components/app/stat-card";
import { StatusLabel } from "@/components/app/status-label";
import { TabBar } from "@/components/app/tab-bar";
import { TextField } from "@/components/app/text-field";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {} from "@/components/ui/tooltip";
import { sampleCustomers, type Customer } from "@/lib/customers";
import { Hint, TruncatedText } from "@/components/app/hint";
import { Demo, DsSection, Group, Mono, Rule } from "./kit";

// ---- Buttons --------------------------------------------------------------

export function Buttons() {
  const variants = ["primary", "secondary", "ghost"] as const;
  return (
    <DsSection
      id="buttons"
      title="Buttons"
      intro="One primary action per screen. Everything else is secondary or ghost. Labels are verbs."
    >
      <Group title="Variants and sizes">
        <Demo caption="Rows: primary, secondary, ghost. Columns: md (44px), sm (36px), icon, icon-sm, disabled.">
          <div className="grid gap-5">
            {variants.map((v) => (
              <div key={v} className="flex flex-wrap items-center gap-4">
                <span className="w-24 text-caption text-ink-soft">{v}</span>
                <Button variant={v}>
                  <Plus size={18} strokeWidth={1.5} aria-hidden />
                  Add customer
                </Button>
                <Button variant={v} size="sm">
                  <Send size={16} strokeWidth={1.5} aria-hidden />
                  Remind
                </Button>
                <Button variant={v} size="icon" aria-label="Download">
                  <Download size={18} strokeWidth={1.5} aria-hidden />
                </Button>
                <Button variant={v} size="icon-sm" aria-label="More">
                  <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
                </Button>
                <Button variant={v} disabled>
                  Disabled
                </Button>
              </div>
            ))}
          </div>
        </Demo>
      </Group>
      <Group
        title="Links and triggers that must look like a button"
        note="Links use asChild, so a plain link or a router Link keeps the button's look. Menu triggers, which only take a className, use buttonClass()."
      >
        <Demo>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild variant="secondary">
              <a href="#buttons">A link, with asChild</a>
            </Button>
            <Button variant="ghost" className="!text-overdue">
              <Trash2 size={18} strokeWidth={1.5} aria-hidden />
              Destructive ghost
            </Button>
          </div>
        </Demo>
      </Group>
      <div className="grid gap-4 md:grid-cols-2">
        <Rule kind="do">
          Label with a verb and the object: <Mono>Add customer</Mono>,{" "}
          <Mono>Record payment</Mono>.
        </Rule>
        <Rule kind="dont">
          Two primary buttons side by side, a grey disabled primary as
          decoration, or a bare icon without an accessible name.
        </Rule>
      </div>
    </DsSection>
  );
}

// ---- Fields ---------------------------------------------------------------

export function Fields() {
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [range, setRange] = useState<DateRangeValue>({
    range: "all",
    from: "",
    to: "",
  });
  const [size, setSize] = useState("10");
  return (
    <DsSection
      id="fields"
      title="Fields"
      intro="One bordered box for every text field. Focus is a clear 2px ring on the box; the input inside never draws its own outline. Labels sit above, errors below."
    >
      <Group title="Text input">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="Input: default, with icon, value">
            <div className="grid gap-3">
              <Input placeholder="Plain input" />
              <SearchField
                value={q}
                onChange={setQ}
                label="Search"
                labelVisible
                placeholder="Name, company or phone"
              />
            </div>
          </Demo>
          <Demo caption="TextField: label, required, error, disabled">
            <div className="grid gap-3">
              <TextField
                label="Name"
                required
                value={name}
                onChange={setName}
              />
              <TextField
                label="Phone"
                value="12-345"
                onChange={() => {}}
                error="Enter a valid phone number."
              />
              <Input disabled placeholder="Disabled" />
            </div>
          </Demo>
        </div>
      </Group>
      <Group title="Choice and date">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="DateRangeFilter: type a date or pick two days; presets beside the calendar">
            <DateRangeFilter
              field="Last activity"
              value={range}
              onChange={setRange}
            />
          </Demo>
          <Demo caption="Select (Radix): keyboard and type-ahead built in">
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger aria-label="Rows per page" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {["10", "25", "50"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Demo>
        </div>
      </Group>
      <Group title="Checkbox">
        <Demo caption="Unchecked, checked, indeterminate (select-all), disabled. Inside a 44px tap target.">
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Unchecked" checked={false} onChange={() => {}} />
            <Checkbox label="Checked" checked onChange={() => {}} />
            <Checkbox
              label="Some selected"
              checked={false}
              indeterminate
              onChange={() => {}}
            />
          </div>
        </Demo>
      </Group>
    </DsSection>
  );
}

// ---- Navigation -----------------------------------------------------------

type Tab = "all" | "owing" | "overdue";

export function Navigation() {
  const [tab, setTab] = useState<Tab>("all");
  const [seg, setSeg] = useState<"a" | "b">("a");
  const [page, setPage] = useState(2);
  const [size, setSize] = useState(10);
  return (
    <DsSection
      id="navigation"
      title="Navigation and filtering"
      intro="Tabs split a list by status. Segmented controls switch a view. Pagination always says where you are."
    >
      <Group title="Tabs">
        <Demo caption="TabBar: brass underline on the active tab, count chip, arrow keys move between tabs, scrolls sideways on phones.">
          <TabBar
            label="Customers"
            idPrefix="ds-tabs"
            hasPanels={false}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", badge: 41 },
              { id: "owing", label: "Outstanding", badge: 24 },
              { id: "overdue", label: "Overdue", badge: 9 },
            ]}
          />
        </Demo>
      </Group>
      <Group title="Segmented control and breadcrumb">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="Segmented: a view switch (density, theme, language)">
            <Segmented
              label="View"
              value={seg}
              onChange={setSeg}
              options={[
                { id: "a", label: "Comfortable" },
                { id: "b", label: "Compact", badge: 2 },
              ]}
            />
          </Demo>
          <Demo caption="Breadcrumb: the last item is the current page">
            <Breadcrumb
              label="Breadcrumb example"
              items={[
                { label: "Home", href: "#navigation" },
                { label: "Customers" },
              ]}
            />
          </Demo>
        </div>
      </Group>
      <Group title="Pagination">
        <Demo className="!p-0">
          <Pagination
            page={page}
            pageSize={size}
            total={41}
            sizes={[10, 25, 50]}
            onPage={setPage}
            onPageSize={(s) => {
              setSize(s);
              setPage(1);
            }}
          />
        </Demo>
      </Group>
    </DsSection>
  );
}

// ---- Data display ---------------------------------------------------------

const sample = sampleCustomers.slice(0, 4);

export function DataDisplay() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const columns: Column<Customer>[] = [
    {
      id: "customer",
      header: "Customer",
      sortKey: "name",
      cell: (c) => (
        <span className="flex items-center gap-3">
          <Avatar name={c.name} />
          <span className="min-w-0">
            <span className="block truncate text-body font-medium text-ink">
              {c.name}
            </span>
            <span className="block truncate text-caption text-ink-soft">
              {c.company}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "w-[140px]",
      cell: (c) =>
        c.overdue > 0 ? (
          <StatusLabel
            tone="overdue"
            label="Overdue"
            detail={`${c.overdueDays} days late`}
          />
        ) : c.outstanding > 0 ? (
          <StatusLabel tone="owing" label="Outstanding" />
        ) : c.credit > 0 ? (
          <StatusLabel tone="credit" label="Credit balance" />
        ) : (
          <StatusLabel tone="settled" label="Settled" />
        ),
    },
    {
      id: "balance",
      header: "Balance",
      sortKey: "owed",
      align: "right",
      width: "w-[160px]",
      cell: (c) => (
        <Money amount={c.outstanding} className="text-body font-semibold" />
      ),
      footer: (
        <Money
          amount={sample.reduce((s, c) => s + c.outstanding, 0)}
          className="text-body font-semibold"
        />
      ),
    },
  ];
  return (
    <DsSection
      id="data"
      title="Data display"
      intro="Status is text, amounts are tabular, tables are first-class and read like a ledger."
    >
      <Group
        title="Status"
        note="One stamp shape for every status (outline, capitals); colour is kept for exceptions (red overdue, amber partly paid, green paid); outstanding, credit and settled stay neutral so the red ones stand out. The optional second line carries the fact behind the status."
      >
        <Demo>
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <StatusLabel tone="overdue" label="Overdue" detail="12 days late" />
            <StatusLabel tone="owing" label="Outstanding" />
            <StatusLabel tone="credit" label="Credit balance" />
            <StatusLabel tone="partly" label="Partly paid" />
            <StatusLabel tone="paid" label="Paid" />
            <StatusLabel tone="settled" label="Settled" />
          </div>
        </Demo>
      </Group>
      <Group title="Badge and avatar">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="Badge: soft, solid (selected), outline. For counts, not status. Square corners like the status stamp.">
            <div className="flex items-center gap-3">
              <Badge>24</Badge>
              <Badge variant="solid">41</Badge>
              <Badge variant="outline">9</Badge>
            </div>
          </Demo>
          <Demo caption="Avatar: initials, 40px and 32px (compact rows)">
            <div className="flex items-center gap-3">
              <Avatar name="Teo Chee Keong" />
              <Avatar name="Rosli Hamzah" size="sm" />
            </div>
          </Demo>
        </div>
      </Group>
      <Group
        title="Money"
        note="One component for every RM amount. Two decimals always; negatives in red with a minus sign."
      >
        <Demo>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="micro mb-1.5">Default</p>
              <Money amount={1234.5} className="text-body" />
            </div>
            <div>
              <p className="micro mb-1.5">Negative</p>
              <Money amount={-100} className="text-body" />
            </div>
            <div>
              <p className="micro mb-1.5">Stat figure</p>
              <Figure amount={95180} />
            </div>
            <div className="md:col-span-3">
              <p className="micro mb-1.5">Hero (Home only)</p>
              <HeroMoney amount={95180} />
            </div>
          </div>
        </Demo>
      </Group>
      <Group title="Cards and KPI band">
        <div className="grid gap-4 lg:grid-cols-2">
          <KpiBand label="Example">
            <Stat label="To collect">
              <div className="mt-3">
                <Figure amount={95180} />
              </div>
              <p className="mt-3 text-caption text-ink-soft">
                24 customers owe you
              </p>
            </Stat>
            <Stat label="Overdue">
              <div className="mt-3">
                <Figure amount={24760} className="text-overdue" />
              </div>
              <p className="mt-3 text-caption text-ink-soft">
                9 customers are late
              </p>
            </Stat>
            <Stat label="Credit">
              <div className="mt-3">
                <Figure amount={320} />
              </div>
            </Stat>
          </KpiBand>
          <Section title="Section card">
            <p className="p-5 text-body text-ink-soft">
              A titled card. Title is a <Mono>t-section</Mono>, a hairline
              underneath, content below.
            </p>
          </Section>
        </div>
      </Group>
      <Group
        title="Data table"
        note="Sticky header, sortable columns, selection, a totals row. Phones get a list instead."
      >
        <Demo className="!p-0">
          <DataTable
            columns={columns}
            rows={sample}
            rowId={(c) => c.id}
            footerLabel="Total balance"
            sort={{
              key: "owed",
              dir: sortDir,
              onSort: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              ariaLabel: (c) => `Sort by ${c}`,
            }}
            selection={{
              selected,
              onToggleRow: (id, on) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (on) next.add(id);
                  else next.delete(id);
                  return next;
                }),
              onTogglePage: (on) =>
                setSelected(on ? new Set(sample.map((c) => c.id)) : new Set()),
              allLabel: "Select all",
              rowLabel: (c) => `Select ${c.name}`,
            }}
          />
        </Demo>
      </Group>
    </DsSection>
  );
}

// ---- Overlays -------------------------------------------------------------

export function Overlays() {
  return (
    <DsSection
      id="overlays"
      title="Menus, dialogs and messages"
      intro="Built on Radix through shadcn/ui, restyled to the tokens. Focus is trapped where it should be, Esc closes, and focus returns to where it came from."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Demo caption="Menu: the first item is the most likely action; destructive items sit last, in red.">
          <Menu
            label="Row actions"
            heading="Ahmad Faizal"
            triggerClassName={buttonClass("secondary")}
            items={[
              { label: "Send reminder", icon: Send, onSelect: () => {} },
              { label: "View customer", icon: Eye, onSelect: () => {} },
              { label: "Create invoice", icon: FilePlus2, onSelect: () => {} },
              "separator",
              {
                label: "Archive customer",
                icon: Archive,
                danger: true,
                onSelect: () => {},
              },
            ]}
          >
            <MoreHorizontal size={18} strokeWidth={1.5} aria-hidden />
            Actions
          </Menu>
        </Demo>
        <Demo caption="Hint: names an icon-only control. Shows on hover and on keyboard focus. Use it instead of a title attribute.">
          <Hint label="Send reminder">
            <Button variant="secondary" size="icon" aria-label="Send reminder">
              <Send size={18} strokeWidth={1.5} aria-hidden />
            </Button>
          </Hint>
        </Demo>
        <Demo caption="TruncatedText: cut off with an ellipsis, so hovering shows the full text. A short line gets no tooltip.">
          <div className="grid gap-2">
            <div className="w-48 rounded-control border border-line bg-surface-2 px-3 py-2">
              <TruncatedText className="text-body text-ink">
                SG Machinery Sdn Bhd · 012-229 6618
              </TruncatedText>
            </div>
            <div className="w-48 rounded-control border border-line bg-surface-2 px-3 py-2">
              <TruncatedText className="text-body text-ink">
                Short text
              </TruncatedText>
            </div>
          </div>
        </Demo>
        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <Rule kind="do">
            Name every icon-only control with <Mono>Hint</Mono> and an{" "}
            <Mono>aria-label</Mono>. Keep it to a few words.
          </Rule>
          <Rule kind="dont">
            Put the only copy of important information in a tooltip (touch
            screens have no hover), or use a native <Mono>title</Mono>.{" "}
            <Mono>npm run check:tokens</Mono> fails on it.
          </Rule>
        </div>
        <Demo caption="Dialog: one decision, a primary action, a cancel. Title says what will happen.">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archive customer?</DialogTitle>
                <DialogDescription>
                  Ahmad Faizal will be hidden from lists. Their invoices stay on
                  record.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary">Cancel</Button>
                <Button>Archive</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Demo>
        <Demo caption="Sheet: a bottom panel for a phone, where a popover would not fit (the list Filters use it below 768px).">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the list by date.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-5 text-body text-ink-soft">
                Sheet content goes here.
              </div>
            </SheetContent>
          </Sheet>
        </Demo>
        <Demo caption="Global search: Ctrl K or ⌘K from anywhere, or the search field in the top bar. Jumps to a page or straight to a customer. Plain substring matching.">
          <p className="text-body text-ink-soft">
            Try it now: press <Mono>Ctrl K</Mono> or <Mono>⌘ K</Mono>.
          </p>
        </Demo>
        <Demo caption="Toast: confirms something that happened. Pauses on hover; keyboard-reachable.">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success("Exported 41 customers as CSV.")}
            >
              Success
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast("Ahmad Faizal owes nothing right now.")}
            >
              Neutral
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast.error("Siti Aminah has no phone number yet.")
              }
            >
              Error
            </Button>
          </div>
        </Demo>
      </div>
    </DsSection>
  );
}

// ---- Feedback and page structure -----------------------------------------

export function Feedback() {
  return (
    <DsSection
      id="feedback"
      title="States and page structure"
      intro="Every list has all of these: first use, nothing found, loading, failed. Every page opens the same way."
    >
      <Group title="Empty, error and loading">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo
            caption="First use: say what this is, offer one action."
            className="!p-0"
          >
            <EmptyState
              title="No customers yet"
              description="Add the people you sell to. You can invoice them right away."
              action={
                <Button>
                  <Plus size={18} strokeWidth={1.5} aria-hidden />
                  Add customer
                </Button>
              }
            />
          </Demo>
          <Demo
            caption="Nothing found: explain, offer the way back."
            className="!p-0"
          >
            <EmptyState
              title="No customers found"
              description="Try a different name, or reset the filters."
              action={<Button variant="secondary">Reset filters</Button>}
            />
          </Demo>
          <Demo caption="Error: what failed, one way forward." className="!p-0">
            <ErrorState
              title="Something went wrong"
              description="We could not load this page. Check your connection and try again."
              action={<Button>Try again</Button>}
            />
          </Demo>
          <Demo caption="Loading: same footprint as the real list, so nothing jumps.">
            <div className="grid gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-4 w-52" />
            </div>
          </Demo>
        </div>
        <div className="mt-4">
          <Demo
            caption="ListSkeleton: the whole loading view of a list page"
            className="max-h-80 overflow-hidden"
          >
            <ListSkeleton label="Loading" rows={3} />
          </Demo>
        </div>
      </Group>
      <Group
        title="Page header"
        note="Breadcrumb or eyebrow, one title, one line of context, the page's actions."
      >
        <Demo>
          <PageHeader
            titleAs="h2"
            crumbsLabel="Page header breadcrumb example"
            crumbs={[
              { label: "Home", href: "#feedback" },
              { label: "Customers" },
            ]}
            title="Customers"
            subtitle="Everyone you sell to, and what they owe you."
            actions={
              <>
                <Button variant="secondary">
                  <Download size={18} strokeWidth={1.5} aria-hidden />
                  Export
                </Button>
                <Button>
                  <Plus size={18} strokeWidth={1.5} aria-hidden />
                  Add customer
                </Button>
              </>
            }
          />
        </Demo>
      </Group>
      <Group
        title="Anatomy of a list page"
        note="Every list (customers, invoices, payments, expenses) is built from these parts, in this order."
      >
        <Demo>
          <ol className="grid gap-2 text-body text-ink">
            {[
              [
                "PageHeader",
                "title, one line of context, the page's actions (no breadcrumb on a top-level list)",
              ],
              ["KpiBand", "three figures; each can filter the list"],
              ["Card", "holds everything below"],
              [
                "TabBar",
                "status split with counts; fades at the edge on a phone",
              ],
              [
                "ListToolbar",
                "search, a Filters button (popover on desktop, bottom sheet on a phone), density",
              ],
              [
                "FilterSummary",
                "“Showing 13 of 41”, filters hidden behind the button as chips, Reset; only while a filter is on",
              ],
              [
                "DataTable",
                "sticky header, sort, selection, totals; Contact column from 1536px; a list on phones",
              ],
              [
                "Bulk bar",
                "floats above the bottom bar while rows are selected",
              ],
              ["Pagination", "range, page size, pages"],
            ].map(([name, what], i) => (
              <li key={name} className="flex gap-3">
                <span className="num w-5 text-ink-faint">{i + 1}</span>
                <span>
                  <Mono>{name}</Mono>{" "}
                  <span className="text-ink-soft">{what}</span>
                </span>
              </li>
            ))}
          </ol>
        </Demo>
      </Group>
    </DsSection>
  );
}
