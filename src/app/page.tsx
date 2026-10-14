"use client";

import React, { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Columns3,
  ListFilter,
  BarChart3,
  History,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Trash2,
  Edit,
  Shield,
  CreditCard,
  UserPlus,
  Zap,
  ChevronRight,
  Clock,
  ArrowRight,
  Send,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Card, Section } from "@/components/app/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { StatusLabel, type Tone } from "@/components/app/status-label";
import { formatMoney, HeroMoney, Money, MoneyOrDash } from "@/components/app/money";
import { useLang, useT } from "@/components/app/preferences";
import { TabBar } from "@/components/app/tab-bar";
import { KanbanBoard } from "@/components/kanban/board.tsx";
import { LeadModal } from "@/components/leads/lead-modal.tsx";
import { QuickActivityModal } from "@/components/leads/quick-activity-modal.tsx";
import { WhatsAppOutreachButton } from "@/components/leads/whatsapp-button.tsx";
import { PricingModal } from "@/components/billing/pricing-modal.tsx";
import { TeamModal } from "@/components/team/team-modal.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ask as askAi } from "@/lib/ask-store";
import {
  CRM_STAGES,
  CRM_PLANS,
  type Lead,
  type Activity,
  type Target,
  type LeadPriority,
  type SubscriptionTier,
  type AuditLog,
  type CRMStage,
} from "@/lib/crm/types.ts";
import { toast } from "sonner";

type DashboardTab = "pipeline" | "leads" | "targets" | "activities" | "audits";

const aiSuggestions = [
  "Show leads overdue for follow-up",
  "Who are our high-priority retail prospects?",
  "Log demo completed for Pak Ali",
  "How much MRR is in active pipeline?",
] as const;

export default function SalesDashboardPage() {
  const t = useT();
  const [lang] = useLang();
  const locale = lang === "ms" ? "ms-MY" : "en-GB";

  const [activeTab, setActiveTab] = useState<DashboardTab>("pipeline");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dailyTarget, setDailyTarget] = useState<Target | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState<Target | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("FREE");
  const [leadQuotaLimit, setLeadQuotaLimit] = useState(50);
  const [userQuotaLimit, setUserQuotaLimit] = useState(1);
  const [loading, setLoading] = useState(true);

  // AI Command Bar
  const [askText, setAskText] = useState("");
  const askRef = useRef<HTMLInputElement>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState<Lead | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Formatted date
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    [locale],
  );

  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  // Fetch all initial CRM data
  async function loadData() {
    try {
      setLoading(true);
      const [leadsRes, actRes, targetDailyRes, targetWeeklyRes, billingRes, auditRes] =
        await Promise.all([
          fetch("/api/crm/leads"),
          fetch("/api/crm/activities"),
          fetch("/api/crm/targets?period=daily"),
          fetch("/api/crm/targets?period=weekly"),
          fetch("/api/crm/billing"),
          fetch("/api/crm/audit-logs"),
        ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (actRes.ok) {
        const data = await actRes.json();
        setActivities(data.activities || []);
      }
      if (targetDailyRes.ok) {
        const data = await targetDailyRes.json();
        setDailyTarget(data.target || null);
      }
      if (targetWeeklyRes.ok) {
        const data = await targetWeeklyRes.json();
        setWeeklyTarget(data.target || null);
      }
      if (billingRes.ok) {
        const data = await billingRes.json();
        if (data.subscription) {
          setSubscriptionTier(data.subscription.tier || "FREE");
          setLeadQuotaLimit(data.subscription.leadQuotaLimit || 50);
          setUserQuotaLimit(data.subscription.userQuotaLimit || 1);
        }
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      toast.error("Could not sync latest CRM data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== "ALL" && l.stage !== stageFilter) return false;
      if (priorityFilter !== "ALL" && l.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCompany = l.company.toLowerCase().includes(q);
        const matchContact = l.contact?.toLowerCase().includes(q);
        const matchCity = l.city?.toLowerCase().includes(q);
        const matchIndustry = l.industry.toLowerCase().includes(q);
        const matchPhone = l.phone?.includes(q);
        return matchCompany || matchContact || matchCity || matchIndustry || matchPhone;
      }
      return true;
    });
  }, [leads, stageFilter, priorityFilter, searchQuery]);

  // Aggregate Metrics
  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== "Won — Paid" && l.stage !== "Lost / Nurture"),
    [leads],
  );
  const wonLeads = useMemo(() => leads.filter((l) => l.stage === "Won — Paid"), [leads]);
  const overdueLeads = useMemo(() => {
    const now = Date.now();
    return leads
      .filter(
        (l) =>
          l.dueDate &&
          new Date(l.dueDate).getTime() < now &&
          l.stage !== "Won — Paid" &&
          l.stage !== "Lost / Nurture",
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [leads]);

  const activePipelineValue = useMemo(
    () => activeLeads.reduce((acc, l) => acc + (l.value || 0), 0),
    [activeLeads],
  );
  const wonPipelineValue = useMemo(
    () => wonLeads.reduce((acc, l) => acc + (l.value || 0), 0),
    [wonLeads],
  );

  // Setup Checklist calculation
  const setupSteps = [
    { label: "Configure daily & weekly quota targets", href: "/targets", done: !!dailyTarget },
    { label: "Add or import qualified prospects", href: "/leads", done: leads.length > 0 },
    { label: "Launch 1-click WhatsApp outreach & log activities", href: "/tasks", done: activities.length > 0 },
  ];
  const doneSetupCount = setupSteps.filter((s) => s.done).length;
  const nextSetupStep = setupSteps.find((s) => !s.done);

  // AI submit
  function handleAiSubmit(e: FormEvent) {
    e.preventDefault();
    if (!askText.trim()) return;
    askAi.open(askText);
    setAskText("");
  }

  // Save Lead
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
      setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? data.lead : l)));
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

  // Log Activity
  async function handleLogActivity(activityData: any) {
    const res = await fetch("/api/crm/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to log activity");
    }
    const data = await res.json();
    setActivities((prev) => [data.activity, ...prev]);
    toast.success("Activity recorded successfully.");
    loadData();
  }

  // Backup Export
  async function handleDownloadBackup() {
    try {
      const res = await fetch("/api/crm/backup");
      if (!res.ok) throw new Error("Failed to export backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CRM backup downloaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download backup.");
    }
  }

  // Backup Restore
  async function handleRestoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/crm/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to restore backup");
      }
      toast.success("Backup imported successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Invalid backup JSON file.");
    } finally {
      e.target.value = "";
    }
  }

  const isNearQuota = leads.length >= leadQuotaLimit * 0.8;

  return (
    <AppShell>
      <PageHeader
        eyebrow={<span suppressHydrationWarning>{today}</span>}
        title="Sales Pipeline & Acquisition HQ"
        subtitle="Manage leads, conduct 1-click WhatsApp outreach, track quotas, and accelerate conversions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTeamModalOpen(true)}
              className="gap-1.5"
            >
              <Users size={16} strokeWidth={1.5} className="text-teal-600" />
              Team (RBAC)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPricingModalOpen(true)}
              className="gap-1.5"
            >
              <CreditCard size={16} strokeWidth={1.5} />
              Plan: {subscriptionTier}
            </Button>
            <Button
              onClick={() => {
                setEditingLead(null);
                setIsLeadModalOpen(true);
              }}
            >
              <Plus size={18} strokeWidth={1.5} />
              New Lead
            </Button>
          </div>
        }
      />

      {/* Plan Quota Alert */}
      {isNearQuota && (
        <div className="mt-4 p-3.5 rounded-control border border-partly/40 bg-surface-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
          <div className="flex items-center gap-2 text-ink font-medium">
            <AlertCircle size={18} className="text-partly shrink-0" />
            <span>
              <strong>Plan quota alert:</strong> You have used {leads.length} of {leadQuotaLimit} allowed leads (
              {Math.round((leads.length / leadQuotaLimit) * 100)}%). Upgrade your plan to prevent inbound lead capture disruption.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsPricingModalOpen(true)}
            className="shrink-0 self-start sm:self-auto font-semibold"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {/* Setup Guide */}
      {nextSetupStep && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div>
              <h2 className="t-section">Acquisition Engine Setup</h2>
              <p className="mt-0.5 text-body text-ink-soft">
                Follow these essential steps to operationalize your B2B sales pipeline.
              </p>
            </div>
            <p className="num text-caption text-ink-soft">
              {doneSetupCount} of {setupSteps.length} complete
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={setupSteps.length}
            aria-valuenow={doneSetupCount}
            className="mt-4 h-1.5 rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-brass transition-all duration-300"
              style={{ width: `${(doneSetupCount / setupSteps.length) * 100}%` }}
            />
          </div>
          <ol className="mt-4 grid gap-2 md:grid-cols-3">
            {setupSteps.map((step, i) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className={`flex min-h-12 items-center gap-3 rounded-control border px-3 text-body transition-colors duration-150 hover:bg-surface-2 ${
                    step === nextSetupStep
                      ? "border-brass bg-surface text-ink font-medium"
                      : "border-line text-ink-soft"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`num flex size-6 shrink-0 items-center justify-center rounded-full border text-caption ${
                      step.done
                        ? "border-primary bg-primary text-on-primary"
                        : "border-field-border text-ink-faint"
                    }`}
                  >
                    {step.done ? <Check size={14} strokeWidth={2} /> : i + 1}
                  </span>
                  <span className="flex-1 text-caption leading-snug">{step.label}</span>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-ink-faint shrink-0" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* AI Command Bar */}
      <div className="mt-6">
        <form role="search" aria-label="Ask Sales AI" onSubmit={handleAiSubmit}>
          <Input
            ref={askRef}
            type="text"
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            placeholder="Tell Sales AI what happened… (e.g. 'Log demo with Pak Ali' or 'Who is overdue?')"
            boxClassName="min-h-[46px]"
            icon={<Sparkles size={18} strokeWidth={1.5} className="text-brass" />}
            trailing={
              <Button type="submit" size="sm" variant="ghost" className="h-8 px-2 text-ink-soft hover:text-ink">
                <Send size={16} strokeWidth={1.5} />
              </Button>
            }
          />
        </form>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-caption text-ink-faint">Try asking:</span>
          {aiSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                askAi.open(suggestion);
              }}
              className="rounded-chip border border-line bg-surface px-2.5 py-1 text-caption text-ink-soft transition-colors duration-150 hover:border-field-border hover:text-ink cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip (Headline CRM KPIs) */}
      <div className="mt-6">
        <SummaryStrip
          label="Sales Pipeline"
          asAt={`as at ${today}`}
          items={[
            {
              label: "Active Pipeline Value",
              value: formatMoney(activePipelineValue),
            },
            {
              label: "Active Opportunities",
              value: `${activeLeads.length} leads`,
            },
            {
              label: "Overdue Follow-ups",
              value: `${overdueLeads.length} leads`,
              danger: overdueLeads.length > 0,
            },
            {
              label: "Won Deals Revenue",
              value: formatMoney(wonPipelineValue),
            },
          ]}
        />
      </div>

      {/* Needs Attention Today (Urgent Overdue Tasks) */}
      {overdueLeads.length > 0 && (
        <Card className="mt-6 p-5 border-overdue/30 bg-surface">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-line">
            <div className="flex items-center gap-2 text-overdue">
              <Clock size={18} strokeWidth={2} />
              <h3 className="t-section text-ink">Needs Attention Today ({overdueLeads.length} Overdue)</h3>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/tasks">View All Tasks Queue</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {overdueLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-control border border-line bg-surface-2 flex flex-col justify-between gap-3 transition-colors hover:border-field-border"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-body font-medium text-ink truncate">
                      {lead.company}
                    </span>
                    <StatusLabel tone="overdue" label={lead.priority} />
                  </div>
                  <p className="mt-1 text-caption text-ink-soft">
                    {lead.nextAction || "Scheduled follow-up"}
                  </p>
                  <p className="mt-1 num text-caption text-overdue font-medium flex items-center gap-1">
                    <Clock size={12} />
                    Due {fmtDate.format(new Date(lead.dueDate!))}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
                  <WhatsAppOutreachButton lead={lead} size="sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLeadForActivity(lead);
                      setIsActivityModalOpen(true);
                    }}
                  >
                    Log Activity
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main View Tabs (Pipeline Kanban / Leads List / Targets / Activities) */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pipeline")}
              className="gap-1.5"
            >
              <Columns3 size={16} strokeWidth={1.5} />
              Pipeline Kanban
            </Button>
            <Button
              variant={activeTab === "leads" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("leads")}
              className="gap-1.5"
            >
              <ListFilter size={16} strokeWidth={1.5} />
              Leads Table ({leads.length})
            </Button>
            <Button
              variant={activeTab === "targets" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("targets")}
              className="gap-1.5"
            >
              <BarChart3 size={16} strokeWidth={1.5} />
              Targets & Quotas
            </Button>
            <Button
              variant={activeTab === "activities" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("activities")}
              className="gap-1.5"
            >
              <History size={16} strokeWidth={1.5} />
              Outreach History
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadBackup} className="gap-1.5">
              <Download size={14} strokeWidth={1.5} />
              Export Backup
            </Button>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-surface-2 text-caption font-medium text-ink transition-colors">
                <Upload size={14} strokeWidth={1.5} />
                Import Backup
              </span>
              <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* View 1: Pipeline Kanban */}
        {activeTab === "pipeline" && (
          <div className="overflow-x-auto pt-2">
            <KanbanBoard
              leads={filteredLeads}
              onLeadsChange={setLeads}
              onLogActivity={(lead) => {
                setSelectedLeadForActivity(lead);
                setIsActivityModalOpen(true);
              }}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setIsLeadModalOpen(true);
              }}
            />
          </div>
        )}

        {/* View 2: Quick Leads Directory Overview */}
        {activeTab === "leads" && (
          <Card className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <p className="text-body font-medium text-ink">
                Showing {filteredLeads.length} leads
              </p>
              <Button asChild size="sm">
                <Link href="/leads">
                  Open Full Dynamic Leads Directory
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-line">
              {filteredLeads.slice(0, 10).map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={lead.company} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-body font-medium text-ink truncate">{lead.company}</span>
                      <span className="text-caption text-ink-soft">
                        {lead.industry} · {lead.contact || "No contact"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusLabel tone={lead.stage === "Won — Paid" ? "paid" : "owing"} label={lead.stage} />
                    <MoneyOrDash amount={lead.value ?? 0} className="num text-body font-semibold text-ink" />
                    <WhatsAppOutreachButton lead={lead} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* View 3: Targets & Quotas Overview */}
        {activeTab === "targets" && (
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h3 className="t-section">Daily Acquisition Benchmarks</h3>
                <p className="text-body text-ink-soft">
                  Key conversion targets required to maintain healthy pipeline velocity.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/targets">Open Targets & Quotas</Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-control border border-line bg-surface-2">
                <span className="text-caption text-ink-soft">Daily Prospects</span>
                <p className="t-stat text-ink mt-1">
                  {leads.length} / {dailyTarget?.prospects || 10}
                </p>
              </div>
              <div className="p-4 rounded-control border border-line bg-surface-2">
                <span className="text-caption text-ink-soft">Daily Outreach</span>
                <p className="t-stat text-ink mt-1">
                  {activities.length} / {dailyTarget?.outreach || 10}
                </p>
              </div>
              <div className="p-4 rounded-control border border-line bg-surface-2">
                <span className="text-caption text-ink-soft">Active Meetings</span>
                <p className="t-stat text-ink mt-1">
                  {leads.filter((l) => l.stage.includes("Meeting")).length} / {dailyTarget?.meetings || 1}
                </p>
              </div>
              <div className="p-4 rounded-control border border-line bg-surface-2">
                <span className="text-caption text-ink-soft">Won Deals</span>
                <p className="t-stat text-ink mt-1">
                  {wonLeads.length} deals
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* View 4: Activities Timeline */}
        {activeTab === "activities" && (
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h3 className="t-section">Recent Outreach Activities</h3>
                <p className="text-body text-ink-soft">
                  Calls, WhatsApp messages, meetings, and notes logged by your team.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/activities">Open All Activities</Link>
              </Button>
            </div>
            <div className="mt-4 divide-y divide-line">
              {activities.length === 0 ? (
                <p className="py-6 text-center text-caption text-ink-soft">No activities logged yet.</p>
              ) : (
                activities.slice(0, 8).map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-body font-medium text-ink">{act.type}</span>
                      <p className="text-caption text-ink-soft mt-0.5">{act.notes || "No notes provided"}</p>
                    </div>
                    <span className="num text-caption text-ink-faint shrink-0">
                      {fmtDate.format(new Date(act.createdAt))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

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
          onSave={handleLogActivity}
        />
      )}

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentTier={subscriptionTier}
        onSelectPlan={(plan: any) => {
          setSubscriptionTier(plan.tier);
          setLeadQuotaLimit(plan.leadQuotaLimit);
          setUserQuotaLimit(plan.userQuotaLimit);
          toast.success(`Switched plan to ${plan.tier}`);
        }}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onOpenPricing={() => {
          setIsTeamModalOpen(false);
          setIsPricingModalOpen(true);
        }}
        currentTier={subscriptionTier}
        userQuotaLimit={userQuotaLimit}
      />
    </AppShell>
  );
}
