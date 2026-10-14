"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  MessageCircle,
  Building2,
  Phone,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { Hint, TruncatedText } from "@/components/app/hint";
import { ListView } from "@/components/app/list-view/list-view";
import type { ListColumn, ListTab, ListFilter } from "@/components/app/list-view/types";
import { Menu, type MenuItem } from "@/components/app/menu";
import { formatMoney, MoneyOrDash } from "@/components/app/money";
import { PageHeader } from "@/components/app/page-header";
import { useLang, useT } from "@/components/app/preferences";
import { ListSkeleton } from "@/components/app/skeleton";
import { StatusLabel, type Tone } from "@/components/app/status-label";
import { SummaryStrip } from "@/components/app/summary-strip";
import { Button } from "@/components/ui/button";
import { LeadModal } from "@/components/leads/lead-modal.tsx";
import { QuickActivityModal } from "@/components/leads/quick-activity-modal.tsx";
import { WhatsAppOutreachButton } from "@/components/leads/whatsapp-button.tsx";
import { CRM_STAGES, CRM_INDUSTRIES, type Lead, type CRMStage, type LeadPriority } from "@/lib/crm/types.ts";
import { toast } from "sonner";

// Tone mapping according to InvoisPro ledger design system:
// Red for urgent/lost/overdue, green for won, amber for in-progress negotiations, neutral/quiet grey for early stages.
function getStageTone(stage: string): Tone {
  switch (stage) {
    case "Won — Paid":
      return "paid";
    case "Lost / Nurture":
      return "overdue";
    case "Negotiation / Decision":
    case "Offer Sent":
      return "partly";
    case "Demo Completed":
    case "Meeting Booked":
    case "Engaged":
      return "owing";
    case "Qualified":
    case "Contacted":
    case "New Lead":
    default:
      return "settled";
  }
}

function getPriorityTone(priority: LeadPriority): Tone {
  switch (priority) {
    case "HIGH":
      return "overdue";
    case "MEDIUM":
      return "partly";
    case "LOW":
    default:
      return "settled";
  }
}

const byCompany = (a: Lead, b: Lead) => a.company.localeCompare(b.company);
const sum = (rows: Lead[], f: (l: Lead) => number) =>
  rows.reduce((total, l) => total + f(l), 0);

function LeadsFallback() {
  const t = useT();
  return (
    <AppShell>
      <ListSkeleton label={t("leads.loading")} />
    </AppShell>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsFallback />}>
      <LeadsView />
    </Suspense>
  );
}

function LeadsView() {
  const t = useT();
  const [lang] = useLang();
  const locale = lang === "ms" ? "ms-MY" : "en-GB";
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState<Lead | null>(null);

  const fmt = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      rel: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    }),
    [locale],
  );

  async function loadLeads() {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to load leads", err);
      toast.error("Could not sync leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    const handler = () => loadLeads();
    window.addEventListener("crm:reload", handler);
    return () => window.removeEventListener("crm:reload", handler);
  }, []);

  // Save Lead (Create or Update)
  async function handleSaveLead(leadData: any) {
    if (editingLead) {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingLead.id, ...leadData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update lead");
      }
      const data = await res.json();
      setLeads((prev) =>
        prev.map((l) => (l.id === editingLead.id ? data.lead : l)),
      );
      toast.success(`Updated ${leadData.company}`);
    } else {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lead");
      }
      const data = await res.json();
      setLeads((prev) => [data.lead, ...prev]);
      toast.success(`Created lead: ${data.lead.company}`);
    }
  }

  // Delete single lead
  async function handleDeleteLead(leadId: string, company: string) {
    if (!confirm(`Are you sure you want to delete "${company}"?`)) return;

    try {
      const res = await fetch(`/api/crm/leads?id=${leadId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete lead");
      }
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success(`Deleted ${company}`);
    } catch (err: any) {
      toast.error(err.message || "Could not delete lead");
    }
  }

  // Update lead stage
  async function handleUpdateStage(leadId: string, newStage: CRMStage) {
    const isWon = newStage === "Won — Paid";
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: newStage,
              status: isWon ? "WON" : newStage === "Lost / Nurture" ? "LOST" : "ACTIVE",
              wonDate: isWon ? new Date() : l.wonDate,
            }
          : l,
      ),
    );

    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          stage: newStage,
          status: isWon ? "WON" : newStage === "Lost / Nurture" ? "LOST" : "ACTIVE",
          wonDate: isWon ? new Date().toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      toast.success(`Stage updated to ${newStage}`);
    } catch {
      toast.error("Failed to update stage on server.");
      loadLeads();
    }
  }

  // Batch delete
  async function handleBatchDelete(selectedLeads: Lead[], clear: () => void) {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedLeads.length} selected leads?`,
      )
    )
      return;

    try {
      await Promise.all(
        selectedLeads.map((l) =>
          fetch(`/api/crm/leads?id=${l.id}`, { method: "DELETE" }),
        ),
      );
      const deletedIds = new Set(selectedLeads.map((l) => l.id));
      setLeads((prev) => prev.filter((l) => !deletedIds.has(l.id)));
      clear();
      toast.success(`Deleted ${selectedLeads.length} leads.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected leads.");
    }
  }

  // Batch change stage
  async function handleBatchStage(
    selectedLeads: Lead[],
    stage: CRMStage,
    clear: () => void,
  ) {
    try {
      await Promise.all(
        selectedLeads.map((l) =>
          fetch("/api/crm/leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: l.id, stage }),
          }),
        ),
      );
      const leadMap = new Map(selectedLeads.map((l) => [l.id, true]));
      setLeads((prev) =>
        prev.map((l) => (leadMap.has(l.id) ? { ...l, stage } : l)),
      );
      clear();
      toast.success(`Updated ${selectedLeads.length} leads to "${stage}".`);
    } catch {
      toast.error("Failed to update selected leads.");
    }
  }

  // Row Kebab Menu
  function rowMenu(lead: Lead): MenuItem[] {
    return [
      {
        label: t("leads.actActivity"),
        icon: Calendar,
        onSelect: () => {
          setSelectedLeadForActivity(lead);
          setIsActivityModalOpen(true);
        },
      },
      {
        label: t("leads.actEdit"),
        icon: Pencil,
        onSelect: () => {
          setEditingLead(lead);
          setIsLeadModalOpen(true);
        },
      },
      "separator",
      {
        label: t("leads.actDelete"),
        icon: Trash2,
        danger: true,
        onSelect: () => handleDeleteLead(lead.id, lead.company),
      },
    ];
  }

  // Aggregate headline KPIs
  const activeLeads = leads.filter(
    (l) => l.stage !== "Won — Paid" && l.stage !== "Lost / Nurture",
  );
  const wonLeads = leads.filter((l) => l.stage === "Won — Paid");
  const overdueLeads = leads.filter(
    (l) =>
      l.dueDate &&
      new Date(l.dueDate).getTime() < now &&
      l.stage !== "Won — Paid" &&
      l.stage !== "Lost / Nurture",
  );
  const activePipelineValue = sum(activeLeads, (l) => l.value ?? 0);
  const totalWonValue = sum(wonLeads, (l) => l.value ?? 0);

  // Dynamic columns for screen and export
  const columns: ListColumn<Lead>[] = [
    {
      id: "company",
      header: t("leads.colCompany"),
      locked: true,
      compare: byCompany,
      firstSort: "asc",
      export: {
        label: t("leads.colCompany"),
        kind: "text",
        value: (l) => l.company,
        width: 25,
      },
      cell: (lead, { compact }) => (
        <span className="flex items-center gap-3">
          <Avatar name={lead.company} size={compact ? "sm" : "md"} />
          <span className="flex min-w-0 flex-col leading-snug">
            <TruncatedText className="text-body font-medium text-ink">
              {lead.company}
            </TruncatedText>
            {!compact && (
              <TruncatedText
                side="bottom"
                className="text-caption text-ink-soft"
              >
                {lead.pain || `${lead.industry} · ${lead.city || "Malaysia"}`}
              </TruncatedText>
            )}
          </span>
        </span>
      ),
    },
    {
      id: "contact",
      header: t("leads.colContact"),
      width: "w-[180px]",
      compare: (a, b) => (a.contact || "").localeCompare(b.contact || ""),
      export: {
        label: t("leads.colContact"),
        kind: "text",
        value: (l) => `${l.contact || ""} ${l.phone || ""}`.trim(),
        width: 20,
      },
      cell: (lead, { compact }) => (
        <div className="flex flex-col gap-1">
          <TruncatedText className="text-body text-ink font-medium">
            {lead.contact || "—"}
          </TruncatedText>
          <div className="flex items-center gap-2">
            <WhatsAppOutreachButton lead={lead} size="sm" />
            {!compact && lead.phone && (
              <span className="num text-caption text-ink-soft">{lead.phone}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "industry",
      header: t("leads.colIndustry"),
      width: "w-[150px]",
      defaultHidden: false,
      compare: (a, b) => a.industry.localeCompare(b.industry),
      export: {
        label: t("leads.colIndustry"),
        kind: "text",
        value: (l) => `${l.industry} (${l.city || "—"})`,
        width: 18,
      },
      cell: (lead, { compact }) => (
        <div className="flex flex-col leading-snug">
          <TruncatedText className="text-body text-ink">
            {lead.industry}
          </TruncatedText>
          {!compact && (
            <span className="text-caption text-ink-soft">{lead.city || "—"}</span>
          )}
        </div>
      ),
    },
    {
      id: "stage",
      header: t("leads.colStage"),
      width: "w-[176px]",
      compare: (a, b) => a.stage.localeCompare(b.stage),
      export: {
        label: t("leads.colStage"),
        kind: "text",
        value: (l) => l.stage,
        width: 16,
      },
      cell: (lead) => {
        const tone = getStageTone(lead.stage);
        return (
          <div className="flex items-center gap-1.5">
            <StatusLabel tone={tone} label={lead.stage} />
          </div>
        );
      },
    },
    {
      id: "priority",
      header: t("leads.colPriority"),
      width: "w-[110px]",
      compare: (a, b) => a.priority.localeCompare(b.priority),
      export: {
        label: t("leads.colPriority"),
        kind: "text",
        value: (l) => l.priority,
        width: 10,
      },
      cell: (lead) => {
        const tone = getPriorityTone(lead.priority);
        return <StatusLabel tone={tone} label={lead.priority} />;
      },
    },
    {
      id: "value",
      header: t("leads.colValue"),
      align: "right",
      width: "w-[140px]",
      compare: (a, b) => (a.value ?? 0) - (b.value ?? 0),
      export: {
        label: t("leads.colValue"),
        kind: "money",
        value: (l) => l.value ?? 0,
        width: 12,
        total: "sum",
      },
      footer: (rows) => {
        const total = sum(rows, (l) => l.value ?? 0);
        return (
          <MoneyOrDash
            amount={total}
            className="text-body font-semibold text-ink"
          />
        );
      },
      cell: (lead) => (
        <MoneyOrDash
          amount={lead.value ?? 0}
          className="text-body font-medium text-ink"
        />
      ),
    },
    {
      id: "nextAction",
      header: t("leads.colNextAction"),
      width: "w-[190px]",
      defaultHidden: false,
      export: {
        label: t("leads.colNextAction"),
        kind: "text",
        value: (l) =>
          `${l.nextAction || ""} ${l.dueDate ? new Date(l.dueDate).toLocaleDateString() : ""}`.trim(),
        width: 22,
      },
      cell: (lead, { compact }) => {
        const isOverdue =
          lead.dueDate &&
          new Date(lead.dueDate).getTime() < now &&
          lead.stage !== "Won — Paid" &&
          lead.stage !== "Lost / Nurture";

        return (
          <div className="flex flex-col leading-snug">
            <TruncatedText className="text-body text-ink">
              {lead.nextAction || "—"}
            </TruncatedText>
            {!compact && lead.dueDate && (
              <span
                className={`num text-caption flex items-center gap-1 ${
                  isOverdue ? "text-overdue font-semibold" : "text-ink-soft"
                }`}
              >
                {isOverdue && <Clock size={12} strokeWidth={2} />}
                {fmt.date.format(new Date(lead.dueDate))}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: t("leads.colActions"),
      locked: true,
      align: "right",
      width: "w-[72px]",
      cell: (lead) => (
        <div className="flex items-center justify-end">
          <Menu
            label={t("leads.rowActions", { name: lead.company })}
            items={rowMenu(lead)}
            triggerClassName="flex size-9 shrink-0 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink cursor-pointer"
          >
            <MoreHorizontal size={18} strokeWidth={1.5} aria-hidden />
          </Menu>
        </div>
      ),
    },
  ];

  // Dynamic tabs
  const tabItems: ListTab<Lead>[] = [
    { id: "all", label: t("leads.tabAll"), match: () => true },
    {
      id: "active",
      label: t("leads.tabActive"),
      match: (l) =>
        l.stage !== "Won — Paid" && l.stage !== "Lost / Nurture",
    },
    {
      id: "overdue",
      label: t("leads.tabOverdue"),
      match: (l) =>
        !!l.dueDate &&
        new Date(l.dueDate).getTime() < now &&
        l.stage !== "Won — Paid" &&
        l.stage !== "Lost / Nurture",
    },
    {
      id: "won",
      label: t("leads.tabWon"),
      match: (l) => l.stage === "Won — Paid",
    },
    {
      id: "lost",
      label: t("leads.tabLost"),
      match: (l) => l.stage === "Lost / Nurture",
    },
  ];

  // Filter definitions
  const filters: ListFilter<Lead>[] = [
    {
      kind: "select",
      id: "stage",
      label: t("leads.filterStage"),
      options: CRM_STAGES.map((s) => ({
        value: s,
        label: s,
        match: (l) => l.stage === s,
      })),
    },
    {
      kind: "select",
      id: "priority",
      label: t("leads.filterPriority"),
      options: [
        {
          value: "HIGH",
          label: t("leads.priorityHigh"),
          match: (l) => l.priority === "HIGH",
        },
        {
          value: "MEDIUM",
          label: t("leads.priorityMedium"),
          match: (l) => l.priority === "MEDIUM",
        },
        {
          value: "LOW",
          label: t("leads.priorityLow"),
          match: (l) => l.priority === "LOW",
        },
      ],
    },
    {
      kind: "numberRange",
      id: "mrr",
      label: t("leads.colValue"),
      placement: "more",
      value: (l) => l.value ?? 0,
      format: (n) => formatMoney(n),
    },
    {
      kind: "select",
      id: "industry",
      label: t("leads.filterIndustry"),
      placement: "more",
      options: CRM_INDUSTRIES.map((ind) => ({
        value: ind,
        label: ind,
        match: (l) => l.industry === ind,
      })),
    },
    {
      kind: "dateRange",
      id: "dueDate",
      label: t("leads.colDueDate"),
      placement: "more",
      value: (l) => (l.dueDate ? new Date(l.dueDate).toISOString() : ""),
      wide: true,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={t("leads.title")}
        subtitle={t("leads.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/pipeline">
                <TrendingUp size={16} strokeWidth={1.5} className="text-teal-600" />
                Pipeline Board
              </Link>
            </Button>
            <Button
              onClick={() => {
                setEditingLead(null);
                setIsLeadModalOpen(true);
              }}
            >
              <Plus size={18} strokeWidth={1.5} aria-hidden />
              {t("leads.add")}
            </Button>
          </div>
        }
      />

      <ListView<Lead>
        id="leads-directory"
        rows={leads}
        rowId={(l) => l.id}
        rowLabel={(l) => l.company}
        columns={columns}
        entity={{
          title: t("leads.title"),
          count: (n) =>
            n === 1 ? t("leads.countOne") : t("leads.count", { count: n }),
        }}
        defaultSort={{ key: "value", dir: "desc" }}
        tiebreak={byCompany}
        tabs={{ label: t("leads.filter"), items: tabItems }}
        search={{
          label: t("leads.searchLabel"),
          placeholder: t("leads.searchPlaceholder"),
          fields: (l) => [l.company, l.contact, l.industry, l.city, l.pain, l.nextAction],
          phoneFields: (l) => [l.phone],
        }}
        filters={filters}
        empty={
          <EmptyState
            title={t("leads.emptyTitle")}
            description={t("leads.emptyBody")}
            action={
              <Button
                onClick={() => {
                  setEditingLead(null);
                  setIsLeadModalOpen(true);
                }}
              >
                <Plus size={18} strokeWidth={1.5} aria-hidden />
                {t("leads.add")}
              </Button>
            }
          />
        }
        above={() => (
          <SummaryStrip
            label={t("leads.title")}
            asAt={t("table.asAt", { date: fmt.date.format(now) })}
            items={[
              {
                label: t("leads.pipelineValue"),
                value: formatMoney(activePipelineValue),
              },
              {
                label: t("leads.activeLeads"),
                value: `${activeLeads.length} leads`,
              },
              {
                label: t("leads.overdueFollowups"),
                value: `${overdueLeads.length} leads`,
                danger: overdueLeads.length > 0,
              },
              {
                label: t("leads.wonDeals"),
                value: formatMoney(totalWonValue),
              },
            ]}
          />
        )}
        bulkActions={({ selected, clear }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-ink-soft pr-2 font-medium">
              {t("leads.selectedCount", { count: selected.length })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBatchStage(selected, "Contacted", clear)}
            >
              Mark Contacted
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBatchStage(selected, "Won — Paid", clear)}
            >
              Mark Won
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!text-overdue hover:!bg-overdue/10"
              onClick={() => handleBatchDelete(selected, clear)}
            >
              <Trash2 size={15} strokeWidth={1.5} aria-hidden />
              {t("leads.batchDelete")}
            </Button>
          </div>
        )}
        mobileRow={(lead) => {
          const tone = getStageTone(lead.stage);
          return (
            <div className="flex items-center justify-between border-b border-line p-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={lead.company} />
                <div className="flex flex-col min-w-0">
                  <span className="text-body font-medium text-ink truncate">
                    {lead.company}
                  </span>
                  <span className="text-caption text-ink-soft">
                    {lead.industry} · {lead.contact || "No contact"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusLabel tone={tone} label={lead.stage} />
                    <MoneyOrDash
                      amount={lead.value ?? 0}
                      className="text-caption font-semibold text-ink"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <WhatsAppOutreachButton lead={lead} size="sm" />
                <Menu
                  label={t("leads.rowActions", { name: lead.company })}
                  items={rowMenu(lead)}
                  triggerClassName="flex size-9 items-center justify-center rounded-control text-ink-soft hover:bg-surface-2"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </Menu>
              </div>
            </div>
          );
        }}
      />

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={editingLead}
        onSave={handleSaveLead}
      />

      {selectedLeadForActivity && (
        <QuickActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setSelectedLeadForActivity(null);
          }}
          lead={selectedLeadForActivity}
          onSave={async (data: any) => {
            const res = await fetch("/api/crm/activities", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              toast.success("Activity logged.");
              loadLeads();
            }
          }}
        />
      )}
    </AppShell>
  );
}
