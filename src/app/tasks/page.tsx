"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Calendar,
  Check,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Card } from "@/components/app/card";
import { PageHeader } from "@/components/app/page-header";
import { StatusLabel } from "@/components/app/status-label";
import { SummaryStrip } from "@/components/app/summary-strip";
import { MoneyOrDash } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import { QuickActivityModal } from "@/components/leads/quick-activity-modal.tsx";
import { WhatsAppOutreachButton } from "@/components/leads/whatsapp-button.tsx";
import type { Lead } from "@/lib/crm/types.ts";
import { toast } from "sonner";

export default function TasksPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
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

  const now = Date.now();
  const todayEnd = new Date().setHours(23, 59, 59, 999);

  const activeLeadsWithTasks = useMemo(() => {
    return leads.filter(
      (l) => l.stage !== "Won — Paid" && l.stage !== "Lost / Nurture",
    );
  }, [leads]);

  const overdueTasks = useMemo(() => {
    return activeLeadsWithTasks.filter(
      (l) => l.dueDate && new Date(l.dueDate).getTime() < now,
    );
  }, [activeLeadsWithTasks, now]);

  const dueTodayTasks = useMemo(() => {
    return activeLeadsWithTasks.filter((l) => {
      if (!l.dueDate) return false;
      const due = new Date(l.dueDate).getTime();
      return due >= now && due <= todayEnd;
    });
  }, [activeLeadsWithTasks, now, todayEnd]);

  const upcomingTasks = useMemo(() => {
    return activeLeadsWithTasks.filter((l) => {
      if (!l.dueDate) return true;
      return new Date(l.dueDate).getTime() > todayEnd;
    });
  }, [activeLeadsWithTasks, todayEnd]);

  async function handleSaveActivity(activityData: {
    leadId: string;
    type: string;
    notes: string;
    nextAction?: string;
  }) {
    const res = await fetch("/api/crm/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to log activity");
    }

    toast.success("Follow-up logged and next action updated.");
    loadLeads();
  }

  return (
    <AppShell>
      <PageHeader
        title="Tasks & Follow-up Queue"
        subtitle="Prioritized operational queue of overdue, due-today, and upcoming prospect touchpoints."
        actions={
          <Button asChild variant="outline">
            <Link href="/pipeline">
              <TrendingUp size={16} strokeWidth={1.5} className="text-teal-600" />
              Pipeline Board
            </Link>
          </Button>
        }
      />

      {/* KPI Band */}
      <div className="mt-4">
        <SummaryStrip
          label="Tasks"
          items={[
            {
              label: "Overdue Tasks",
              value: `${overdueTasks.length} tasks`,
              danger: overdueTasks.length > 0,
            },
            {
              label: "Due Today",
              value: `${dueTodayTasks.length} tasks`,
            },
            {
              label: "Upcoming Scheduled",
              value: `${upcomingTasks.length} tasks`,
            },
            {
              label: "Total Pipeline In-Flight",
              value: `${activeLeadsWithTasks.length} leads`,
            },
          ]}
        />
      </div>

      <div className="mt-6 space-y-8">
        {/* SECTION 1: OVERDUE TASKS */}
        {overdueTasks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-overdue">
              <AlertCircle size={18} strokeWidth={2} />
              <h2 className="t-section text-ink">
                Overdue Follow-ups ({overdueTasks.length})
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {overdueTasks.map((lead) => (
                <Card
                  key={lead.id}
                  className="p-4 border-overdue/40 flex flex-col justify-between gap-3 hover:shadow-float transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={lead.company} size="sm" />
                        <h4 className="font-semibold text-body text-ink truncate">
                          {lead.company}
                        </h4>
                      </div>
                      <StatusLabel tone="overdue" label={lead.priority} />
                    </div>

                    <p className="mt-2 text-body text-ink font-medium">
                      {lead.nextAction || "Follow-up required"}
                    </p>
                    <p className="mt-1 num text-caption text-overdue font-semibold flex items-center gap-1">
                      <Clock size={12} strokeWidth={2} />
                      Due {new Date(lead.dueDate!).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-caption text-ink-soft">
                      <span>{lead.contact || lead.industry}</span>
                      <MoneyOrDash amount={lead.value ?? 0} className="num font-semibold text-ink" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <WhatsAppOutreachButton lead={lead} size="sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsActivityModalOpen(true);
                      }}
                    >
                      Complete & Log
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: DUE TODAY */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brass">
            <CalendarClock size={18} strokeWidth={2} />
            <h2 className="t-section text-ink">
              Due Today ({dueTodayTasks.length})
            </h2>
          </div>

          {dueTodayTasks.length === 0 ? (
            <Card className="p-6 text-center text-caption text-ink-soft">
              No tasks due today. All caught up!
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dueTodayTasks.map((lead) => (
                <Card
                  key={lead.id}
                  className="p-4 border-line flex flex-col justify-between gap-3 hover:shadow-float transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={lead.company} size="sm" />
                        <h4 className="font-semibold text-body text-ink truncate">
                          {lead.company}
                        </h4>
                      </div>
                      <StatusLabel tone="owing" label={lead.priority} />
                    </div>

                    <p className="mt-2 text-body text-ink font-medium">
                      {lead.nextAction || "Scheduled call / demo"}
                    </p>
                    <p className="mt-1 num text-caption text-brass font-medium flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.5} />
                      Today by {new Date(lead.dueDate!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-caption text-ink-soft">
                      <span>{lead.contact || lead.industry}</span>
                      <MoneyOrDash amount={lead.value ?? 0} className="num font-semibold text-ink" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <WhatsAppOutreachButton lead={lead} size="sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsActivityModalOpen(true);
                      }}
                    >
                      Complete & Log
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: UPCOMING */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-ink-soft">
            <Calendar size={18} strokeWidth={1.5} />
            <h2 className="t-section text-ink">
              Upcoming Scheduled ({upcomingTasks.length})
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.slice(0, 9).map((lead) => (
              <Card
                key={lead.id}
                className="p-4 border-line flex flex-col justify-between gap-3 hover:shadow-2xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={lead.company} size="sm" />
                      <h4 className="font-semibold text-body text-ink truncate">
                        {lead.company}
                      </h4>
                    </div>
                    <StatusLabel tone="settled" label={lead.priority} />
                  </div>

                  <p className="mt-2 text-body text-ink">
                    {lead.nextAction || "Planned check-in"}
                  </p>
                  <p className="mt-1 num text-caption text-ink-soft flex items-center gap-1">
                    <Clock size={12} strokeWidth={1.5} />
                    {lead.dueDate ? new Date(lead.dueDate).toLocaleDateString() : "Flexible schedule"}
                  </p>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <WhatsAppOutreachButton lead={lead} size="sm" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsActivityModalOpen(true);
                    }}
                  >
                    Log Activity
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {selectedLead && (
        <QuickActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSaveActivity={handleSaveActivity}
        />
      )}
    </AppShell>
  );
}
