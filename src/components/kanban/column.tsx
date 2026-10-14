"use client";

import React, { useState } from "react";
import { KanbanLeadCard } from "./lead-card.tsx";
import { formatMoney } from "@/components/app/money";
import type { Lead } from "@/lib/crm/types.ts";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  onMoveStage: (leadId: string, newStage: string) => void;
  onLogActivity: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

export function KanbanColumn({
  id,
  title,
  leads,
  onMoveStage,
  onLogActivity,
  onEditLead,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const totalValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const getStageAccent = (t: string) => {
    switch (t) {
      case "Won — Paid":
        return "border-t-paid";
      case "Lost / Nurture":
        return "border-t-overdue";
      case "Negotiation":
      case "Proposal Sent":
        return "border-t-partly";
      case "Demo Completed":
      case "Demo Scheduled":
      case "Meeting Scheduled":
        return "border-t-brass";
      default:
        return "border-t-primary";
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const leadId = e.dataTransfer.getData("text/plain");
        if (leadId) {
          onMoveStage(leadId, id);
        }
      }}
      className={`flex flex-col w-76 shrink-0 rounded-card bg-surface-2/60 border ${
        isDragOver
          ? "border-primary ring-2 ring-primary/40 bg-surface scale-[1.01]"
          : "border-line"
      } border-t-4 ${getStageAccent(title)} max-h-[82vh] transition-all duration-150 shadow-2xs`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-line flex items-center justify-between bg-surface/40 rounded-t-card">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-caption text-ink uppercase tracking-wider">
              {title}
            </h3>
            <span className="num px-1.5 py-0.5 text-micro font-bold rounded-chip bg-surface border border-line text-ink-soft">
              {leads.length}
            </span>
          </div>
          {totalValue > 0 && (
            <div className="num text-micro font-medium text-ink-soft mt-0.5">
              {formatMoney(totalValue)}
            </div>
          )}
        </div>
      </div>

      {/* Cards Scroll Area */}
      <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 min-h-[140px]">
        {leads.length === 0 ? (
          <div className="h-28 border border-dashed border-line rounded-control flex items-center justify-center text-center p-3 text-caption text-ink-faint">
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanLeadCard
              key={lead.id}
              lead={lead}
              onMoveStage={onMoveStage}
              onLogActivity={onLogActivity}
              onEditLead={onEditLead}
            />
          ))
        )}
      </div>
    </div>
  );
}
