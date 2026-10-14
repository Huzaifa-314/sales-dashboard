import fs from "fs";
import { crmDb } from "./db.ts";
import type { LeadPriority, DealStatus } from "./types.ts";

export interface SingleFileBackup {
  leads?: Array<{
    id: string;
    company: string;
    contact?: string;
    industry?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
    source?: string;
    stage?: string;
    priority?: string;
    score?: number | string;
    mrr?: number | string;
    lastContact?: string;
    nextAction?: string;
    dueDate?: string;
    closeDate?: string;
    pain?: string;
    dealStatus?: string;
    notes?: string;
    lossReason?: string;
    wonDate?: string;
    createdAt?: string;
  }>;
  activities?: Array<{
    id?: string;
    leadId: string;
    type: string;
    notes: string;
    next?: string;
    nextAction?: string;
    date?: string;
    createdAt?: string;
  }>;
  targets?: {
    daily?: Record<string, number>;
    weekly?: Record<string, number>;
  };
}

export async function importSingleFileBackup(
  filePathOrData: string | SingleFileBackup,
  organizationId: string,
  userId?: string,
): Promise<{ importedLeads: number; importedActivities: number }> {
  let rawData: SingleFileBackup;
  if (typeof filePathOrData === "string") {
    const content = fs.readFileSync(filePathOrData, "utf-8");
    rawData = JSON.parse(content);
  } else {
    rawData = filePathOrData;
  }

  const leads = rawData.leads || [];
  const activities = rawData.activities || [];
  const leadIdMapping = new Map<string, string>();

  const priorityMap: Record<string, LeadPriority> = {
    High: "HIGH",
    Medium: "MEDIUM",
    Low: "LOW",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  };

  const statusMap: Record<string, DealStatus> = {
    Open: "OPEN",
    "Won — Paid": "WON_PAID",
    Won_Paid: "WON_PAID",
    WON_PAID: "WON_PAID",
    Lost: "LOST",
    LOST: "LOST",
    Nurture: "NURTURE",
    NURTURE: "NURTURE",
  };

  for (const l of leads) {
    const createdLead = crmDb.createLead({
      organizationId,
      assignedToId: userId || null,
      company: l.company || "Unnamed Company",
      contact: l.contact || null,
      industry: l.industry || "Other SMB",
      city: l.city || null,
      phone: l.phone || null,
      email: l.email || null,
      website: l.website || null,
      source: l.source || "Imported Backup",
      stage: l.stage || "New Lead",
      priority: priorityMap[l.priority || ""] || "MEDIUM",
      score: Number(l.score) || 5,
      mrr: Number(l.mrr) || 0,
      nextAction: l.nextAction || "First outreach",
      dueDate: l.dueDate ? new Date(l.dueDate) : null,
      closeDate: l.closeDate ? new Date(l.closeDate) : null,
      pain: l.pain || null,
      dealStatus: statusMap[l.dealStatus || ""] || "OPEN",
      notes: l.notes || null,
      wonDate: l.wonDate ? new Date(l.wonDate) : null,
    });

    if (l.id) {
      leadIdMapping.set(l.id, createdLead.id);
    }
  }

  let importedActivities = 0;
  for (const a of activities) {
    const cloudLeadId = leadIdMapping.get(a.leadId);
    if (!cloudLeadId) continue;

    crmDb.createActivity({
      organizationId,
      leadId: cloudLeadId,
      userId: userId || null,
      type: a.type || "Note",
      notes: a.notes || "",
      nextAction: a.next || a.nextAction || null,
      createdAt: a.date ? new Date(a.date) : a.createdAt ? new Date(a.createdAt) : new Date(),
    });
    importedActivities++;
  }

  if (rawData.targets) {
    if (rawData.targets.daily) {
      crmDb.updateTarget(organizationId, "daily", rawData.targets.daily);
    }
    if (rawData.targets.weekly) {
      crmDb.updateTarget(organizationId, "weekly", rawData.targets.weekly);
    }
  }

  return {
    importedLeads: leads.length,
    importedActivities,
  };
}
