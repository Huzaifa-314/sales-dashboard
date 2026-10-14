"use client";

import React from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./column.tsx";
import { CRM_STAGES, type Lead } from "@/lib/crm/types.ts";

interface KanbanBoardProps {
  leads: Lead[];
  onLeadsChange: (updatedLeads: Lead[]) => void;
  onLogActivity: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

export function KanbanBoard({
  leads,
  onLeadsChange,
  onLogActivity,
  onEditLead,
}: KanbanBoardProps) {
  async function handleMoveStage(leadId: string, newStage: string) {
    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead || currentLead.stage === newStage) return;

    const previousLeads = [...leads];
    const isWon = newStage === "Won — Paid";
    const updatedLeads = leads.map((l) =>
      l.id === leadId
        ? {
            ...l,
            stage: newStage,
            dealStatus: isWon ? ("WON_PAID" as const) : l.dealStatus,
            wonDate: isWon ? new Date() : l.wonDate,
          }
        : l,
    );
    onLeadsChange(updatedLeads);

    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          stage: newStage,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead stage");
      }

      toast.success(`Moved ${currentLead.company} to ${newStage}`);
    } catch (err: any) {
      onLeadsChange(previousLeads);
      toast.error(err.message || "Failed to update pipeline stage.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none">
      {CRM_STAGES.map((stage) => (
        <KanbanColumn
          key={stage}
          id={stage}
          title={stage}
          leads={leads.filter((l) => l.stage === stage)}
          onMoveStage={handleMoveStage}
          onLogActivity={onLogActivity}
          onEditLead={onEditLead}
        />
      ))}
    </div>
  );
}
