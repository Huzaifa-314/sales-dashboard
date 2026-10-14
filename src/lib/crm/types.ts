export type Role = "OWNER" | "ADMIN" | "SALES_REP" | "VIEWER";
export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";
export type DealStatus = "OPEN" | "WON_PAID" | "LOST" | "NURTURE";
export type SubscriptionTier = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  role: Role;
  organizationId: string;
  userId: string;
  createdAt: Date;
  organization?: Organization;
  user?: User;
}

export interface Lead {
  id: string;
  organizationId: string;
  assignedToId?: string | null;
  company: string;
  contact?: string | null;
  industry: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source: string;
  stage: string;
  priority: LeadPriority;
  score: number;
  mrr: number;
  value?: number;
  lastContact?: Date | null;
  nextAction: string;
  dueDate?: Date | null;
  closeDate?: Date | null;
  pain?: string | null;
  dealStatus: DealStatus;
  notes?: string | null;
  lossReason?: string | null;
  wonDate?: Date | null;
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: User | null;
  activities?: Activity[];
}

export interface CreateLeadInput {
  organizationId: string;
  assignedToId?: string | null;
  company: string;
  contact?: string | null;
  industry: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source?: string;
  stage?: string;
  priority?: LeadPriority;
  score?: number;
  mrr?: number;
  value?: number;
  nextAction?: string;
  dueDate?: Date | null;
  closeDate?: Date | null;
  pain?: string | null;
  notes?: string | null;
  dealStatus?: DealStatus;
  wonDate?: Date | null;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  id: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  leadId: string;
  userId?: string | null;
  type: string;
  notes: string;
  nextAction?: string | null;
  createdAt: Date;
  user?: User | null;
}

export interface Target {
  id: string;
  organizationId: string;
  period: "daily" | "weekly";
  prospects: number;
  outreach: number;
  followups: number;
  positive: number;
  meetings: number;
  demos: number;
  paid: number;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  organizationId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
  leadQuotaLimit: number;
  userQuotaLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyHash: string;
  lastUsedAt?: Date | null;
  createdAt: Date;
}

export interface LeadCaptureForm {
  id: string;
  organizationId: string;
  title: string;
  defaultIndustry: string;
  defaultSource: string;
  isActive: boolean;
  createdAt: Date;
}

export const CRM_STAGES = [
  "New Lead",
  "Qualified",
  "Contacted",
  "Engaged",
  "Meeting Booked",
  "Demo Completed",
  "Offer Sent",
  "Negotiation / Decision",
  "Won — Paid",
  "Lost / Nurture",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];
export type CRMStage = CrmStage;

export const CRM_INDUSTRIES = [
  "Retail / shop",
  "Beauty / salon",
  "Repair / maintenance",
  "Contractor / services",
  "Online seller",
  "Trading / wholesale",
  "Other SMB",
] as const;

export const CRM_ACTIVITY_TYPES = [
  "Phone Call",
  "WhatsApp Chat",
  "Meeting",
  "Product Demo",
  "Offer Sent",
  "Payment Received",
  "Note",
] as const;

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  priceMonthlyMYR: number;
  priceMonthlyUSD: number;
  userQuotaLimit: number;
  leadQuotaLimit: number;
  features: string[];
}

export const CRM_PLANS: Record<SubscriptionTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    name: "Free Plan",
    priceMonthlyMYR: 0,
    priceMonthlyUSD: 0,
    userQuotaLimit: 1,
    leadQuotaLimit: 50,
    features: [
      "1 User Seat",
      "50 Active Leads Quota",
      "10-Stage Pipeline Board",
      "Manual Activity & Tasks Queue",
      "JSON Backup Export / Import",
    ],
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter Plan",
    priceMonthlyMYR: 49,
    priceMonthlyUSD: 12,
    userQuotaLimit: 1,
    leadQuotaLimit: 500,
    features: [
      "1 User Seat",
      "500 Active Leads Quota",
      "1-Click WhatsApp Direct Outreach",
      "Daily & Weekly Performance Quotas",
      "Activity Audit Stream",
    ],
  },
  GROWTH: {
    tier: "GROWTH",
    name: "Growth Plan",
    priceMonthlyMYR: 149,
    priceMonthlyUSD: 35,
    userQuotaLimit: 5,
    leadQuotaLimit: 10000,
    features: [
      "Up to 5 User Seats",
      "10,000 Leads Quota",
      "Public Inbound Webhook Lead Capture API",
      "Multi-User Role Scoping (RBAC)",
      "Automated Quota Alerts",
      "Priority WhatsApp Support",
    ],
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise Plan",
    priceMonthlyMYR: 299,
    priceMonthlyUSD: 75,
    userQuotaLimit: 15,
    leadQuotaLimit: 100000,
    features: [
      "Up to 15 User Seats",
      "Unlimited Leads Quota",
      "Full Security Audit Logs & Compliance",
      "Custom Pipeline Workflows",
      "Dedicated Onboarding & Migration",
    ],
  },
};

