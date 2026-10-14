"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Filter, RefreshCw, FolderKanban, ListFilter, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { KanbanBoard } from "@/components/kanban/board.tsx";
import { LeadModal } from "@/components/leads/lead-modal.tsx";
import { QuickActivityModal } from "@/components/leads/quick-activity-modal.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/components/app/money";
import { CRM_STAGES, type Lead } from "@/lib/crm/types.ts";
import { toast } from "sonner";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState<Lead | null>(null);

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
      toast.error("Could not sync latest leads.");
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

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (priorityFilter !== "ALL" && l.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          l.company.toLowerCase().includes(q) ||
          (l.contact && l.contact.toLowerCase().includes(q)) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          l.industry.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, searchQuery, priorityFilter]);

  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== "Won — Paid" && l.stage !== "Lost / Nurture"),
    [leads],
  );
  const totalPipelineValue = useMemo(
    () => activeLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
    [activeLeads],
  );
  const wonLeads = useMemo(() => leads.filter((l) => l.stage === "Won — Paid"), [leads]);
  const totalWonValue = useMemo(
    () => wonLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
    [wonLeads],
  );
  const overdueLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.dueDate &&
          new Date(l.dueDate).getTime() < Date.now() &&
          l.stage !== "Won — Paid" &&
          l.stage !== "Lost / Nurture",
      ),
    [leads],
  );

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

  async function handleSaveActivity(activityData: {
    leadId: string;
    type: string;
    notes?: string;
    nextAction?: string;
    dueDate?: string;
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
    toast.success("Activity recorded successfully.");
    loadLeads();
  }

  return (
    <AppShell>
      <PageHeader
        title="Interactive Pipeline Kanban"
        subtitle="10 stages with native HTML5 drag-and-drop, quick WhatsApp outreach, and real-time deal values."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/leads">
                <ListFilter size={16} strokeWidth={1.5} />
                Leads Table
              </Link>
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

      {/* Headline Figures */}
      <div className="mt-4">
        <SummaryStrip
          label="Pipeline"
          items={[
            {
              label: "Active Pipeline Value",
              value: formatMoney(totalPipelineValue),
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
              label: "Won Revenue",
              value: formatMoney(totalWonValue),
            },
          ]}
        />
      </div>

      {/* Filter Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 p-3 rounded-control border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search companies, contacts, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-caption pl-9 pr-3 py-1.5 rounded-control bg-field border border-field-border text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-caption px-3 py-1.5 rounded-control bg-field border border-field-border text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        <span className="num text-caption text-ink-soft">
          Showing {filteredLeads.length} leads
        </span>
      </div>

      {/* 10-Stage Kanban Board */}
      <div className="mt-4 overflow-x-auto pb-6">
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
          onSaveActivity={handleSaveActivity}
        />
      )}
    </AppShell>
  );
}
