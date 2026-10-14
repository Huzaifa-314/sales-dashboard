"use client";

import React, { useState } from "react";
import { Clock, Edit, GripVertical, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { MoneyOrDash } from "@/components/app/money";
import { StatusLabel, type Tone } from "@/components/app/status-label";
import { WhatsAppOutreachButton } from "@/components/leads/whatsapp-button.tsx";
import { CRM_STAGES, type Lead, type LeadPriority } from "@/lib/crm/types.ts";

interface LeadCardProps {
  lead: Lead;
  onMoveStage: (leadId: string, newStage: string) => void;
  onLogActivity: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
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

export function KanbanLeadCard({
  lead,
  onMoveStage,
  onLogActivity,
  onEditLead,
}: LeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const isOverdue =
    lead.dueDate &&
    new Date(lead.dueDate).getTime() < Date.now() &&
    lead.stage !== "Won — Paid" &&
    lead.stage !== "Lost / Nurture";

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      className={`group relative rounded-control border p-3 bg-surface shadow-2xs hover:shadow-float cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging
          ? "opacity-30 scale-95 border-dashed border-primary bg-surface-2"
          : ""
      } ${
        isOverdue ? "border-overdue/60 bg-surface" : "border-line"
      }`}
    >
      {/* Top row: Avatar + Company Name + Priority + Edit */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="size-3.5 text-ink-faint group-hover:text-ink-soft shrink-0" />
          <Avatar name={lead.company} size="sm" />
          <h4 className="font-semibold text-caption text-ink leading-snug truncate">
            {lead.company}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusLabel tone={getPriorityTone(lead.priority)} label={lead.priority} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditLead(lead);
            }}
            className="p-1 rounded-control text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            title="Edit lead"
          >
            <Edit size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Subtitle / Industry */}
      <div className="text-caption text-ink-soft pl-5 mb-2 leading-tight">
        <span className="truncate block">
          {lead.contact || lead.industry}
          {lead.city ? ` · ${lead.city}` : ""}
        </span>
      </div>

      {/* Pain note if present */}
      {lead.pain && (
        <div className="text-micro text-ink-faint line-clamp-2 pl-5 mb-2.5 italic">
          "{lead.pain}"
        </div>
      )}

      {/* Value and Next Action Footer */}
      <div className="pt-2 border-t border-line flex items-center justify-between gap-2 pl-5">
        <MoneyOrDash
          amount={lead.value ?? 0}
          className="num text-caption font-semibold text-ink"
        />

        <div className="flex items-center gap-1">
          <WhatsAppOutreachButton lead={lead} size="sm" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLogActivity(lead);
            }}
            className="px-2 py-0.5 rounded-control text-micro font-medium border border-line bg-surface hover:bg-surface-2 text-ink-soft hover:text-ink transition-colors cursor-pointer"
            title="Log activity"
          >
            + Log
          </button>
        </div>
      </div>

      {/* Overdue alert indicator */}
      {isOverdue && (
        <div className="mt-2 pl-5 flex items-center gap-1 num text-micro text-overdue font-medium">
          <Clock size={11} strokeWidth={2} />
          <span>Follow-up overdue</span>
        </div>
      )}
    </div>
  );
}
