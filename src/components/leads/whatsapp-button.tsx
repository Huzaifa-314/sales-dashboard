"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { generateWhatsAppUrl } from "@/lib/crm/whatsapp.ts";

interface WhatsAppButtonProps {
  lead: {
    phone?: string | null;
    company: string;
    contact?: string | null;
  };
  customMessage?: string;
  size?: "sm" | "md";
  className?: string;
}

export function WhatsAppOutreachButton({
  lead,
  customMessage,
  size = "sm",
  className = "",
}: WhatsAppButtonProps) {
  if (!lead.phone) return null;

  const waUrl = generateWhatsAppUrl(
    lead.phone,
    lead.company,
    lead.contact,
    customMessage,
  );

  if (!waUrl) return null;

  const isSmall = size === "sm";

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 ${
        isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"
      } ${className}`}
      title={`Chat with ${lead.contact || lead.company} on WhatsApp`}
    >
      <MessageSquare className={isSmall ? "w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" : "w-4 h-4 text-emerald-600 dark:text-emerald-400"} />
      <span>WhatsApp</span>
    </a>
  );
}
