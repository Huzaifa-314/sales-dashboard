import { CRM_STAGES, type LeadPriority, type CreateLeadInput } from "./types.ts";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function sanitizeText(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (!str) return null;
  // Block or strip script tags and javascript: URIs
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "");
}

export function validateLeadInput(body: any): Omit<CreateLeadInput, "organizationId"> {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request payload must be a JSON object.");
  }

  const cleanCompany = sanitizeText(body.company);
  if (!cleanCompany || cleanCompany.length < 1) {
    throw new ValidationError("Company name is required and cannot be empty.");
  }
  if (cleanCompany.length > 200) {
    throw new ValidationError("Company name cannot exceed 200 characters.");
  }

  let stage = body.stage || "New Lead";
  if (!CRM_STAGES.includes(stage)) {
    stage = "New Lead";
  }

  let priority: LeadPriority = "MEDIUM";
  if (body.priority === "HIGH" || body.priority === "LOW" || body.priority === "MEDIUM") {
    priority = body.priority;
  }

  const mrr = Number(body.mrr) || 0;
  if (mrr < 0 || mrr > 1_000_000) {
    throw new ValidationError("Expected MRR must be a positive number up to 1,000,000.");
  }

  const score = Math.max(0, Math.min(10, Math.round(Number(body.score) || 5)));

  let email = sanitizeText(body.email);
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError(`Invalid email format: ${email}`);
    }
  }

  return {
    company: cleanCompany,
    contact: sanitizeText(body.contact),
    industry: sanitizeText(body.industry) || "Other SMB",
    city: sanitizeText(body.city),
    phone: sanitizeText(body.phone),
    email,
    website: sanitizeText(body.website),
    source: sanitizeText(body.source) || "Manual Entry",
    stage,
    priority,
    score,
    mrr,
    nextAction: sanitizeText(body.nextAction) || "First outreach",
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    closeDate: body.closeDate ? new Date(body.closeDate) : null,
    pain: sanitizeText(body.pain),
    notes: sanitizeText(body.notes),
  };
}

export function validateActivityInput(body: any): {
  leadId: string;
  type: string;
  notes: string;
  nextAction?: string | null;
} {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request payload must be a JSON object.");
  }

  if (!body.leadId || typeof body.leadId !== "string") {
    throw new ValidationError("Valid leadId is required.");
  }

  const cleanNotes = sanitizeText(body.notes);
  if (!cleanNotes || cleanNotes.length < 1) {
    throw new ValidationError("Activity notes are required.");
  }

  return {
    leadId: body.leadId.trim(),
    type: sanitizeText(body.type) || "Phone Call",
    notes: cleanNotes,
    nextAction: sanitizeText(body.nextAction),
  };
}
