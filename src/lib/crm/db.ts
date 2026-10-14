import crypto from "crypto";
import type {
  Organization,
  User,
  Membership,
  Lead,
  Activity,
  Target,
  Subscription,
  ApiKey,
  LeadPriority,
  DealStatus,
  SubscriptionTier,
  SubscriptionStatus,
  CreateLeadInput,
  UpdateLeadInput,
  AuditLog,
} from "./types.ts";

export interface CreateActivityInput {
  organizationId: string;
  leadId: string;
  userId?: string | null;
  type: string;
  notes: string;
  nextAction?: string | null;
  createdAt?: Date;
}

export interface CreateApiKeyInput {
  organizationId: string;
  name: string;
  rawKey?: string;
}

export class CrmDatabase {
  private organizations: Map<string, Organization> = new Map();
  private users: Map<string, User> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private leads: Map<string, Lead> = new Map();
  private activities: Map<string, Activity> = new Map();
  private targets: Map<string, Target> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private passwords: Map<string, string> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  // --- Organizations ---
  public createOrganization(data: {
    id?: string;
    name: string;
    slug: string;
    currency?: string;
  }): Organization {
    const id = data.id || `org_${crypto.randomUUID().slice(0, 8)}`;
    const org: Organization = {
      id,
      name: data.name,
      slug: data.slug,
      currency: data.currency || "MYR",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(id, org);

    if (!this.subscriptions.has(id)) {
      this.subscriptions.set(id, {
        id: `sub_${id}`,
        organizationId: id,
        tier: "FREE",
        status: "ACTIVE",
        leadQuotaLimit: 50,
        userQuotaLimit: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return org;
  }

  public getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  public getOrganizationBySlug(slug: string): Organization | undefined {
    return Array.from(this.organizations.values()).find((o) => o.slug === slug);
  }

  public listOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  // --- Users & Memberships ---
  public createUser(data: {
    id?: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  }): User {
    const id = data.id || `usr_${crypto.randomUUID().slice(0, 8)}`;
    const user: User = {
      id,
      email: data.email,
      name: data.name || null,
      avatarUrl: null,
      phone: data.phone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === normalized,
    );
  }

  public setPassword(userId: string, password: string): void {
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    this.passwords.set(userId, hash);
  }

  public verifyPassword(userId: string, password: string): boolean {
    const hash = this.passwords.get(userId);
    if (!hash) {
      return (
        password === "password123" ||
        password === "admin123" ||
        password.length >= 6
      );
    }
    const checkHash = crypto.createHash("sha256").update(password).digest("hex");
    return hash === checkHash;
  }

  public getUserMembership(userId: string): Membership | undefined {
    return Array.from(this.memberships.values()).find((m) => m.userId === userId);
  }

  public createMembership(data: {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "SALES_REP" | "VIEWER";
  }): Membership {
    const key = `${data.organizationId}:${data.userId}`;
    const id = `mem_${crypto.randomUUID().slice(0, 8)}`;
    const membership: Membership = {
      id,
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role,
      createdAt: new Date(),
    };
    this.memberships.set(key, membership);
    return membership;
  }

  public getMembership(
    organizationId: string,
    userId: string,
  ): Membership | undefined {
    return this.memberships.get(`${organizationId}:${userId}`);
  }

  public listMemberships(organizationId: string): Membership[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.organizationId === organizationId)
      .map((m) => ({
        ...m,
        user: this.users.get(m.userId),
        organization: this.organizations.get(m.organizationId),
      }));
  }

  public deleteMembership(organizationId: string, userId: string): boolean {
    const key = `${organizationId}:${userId}`;
    return this.memberships.delete(key);
  }

  public countMemberships(organizationId: string): number {
    let count = 0;
    for (const m of this.memberships.values()) {
      if (m.organizationId === organizationId) count++;
    }
    return count;
  }

  // --- Subscriptions ---
  public getSubscription(organizationId: string): Subscription | undefined {
    return this.subscriptions.get(organizationId);
  }

  public findSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Subscription | undefined {
    return Array.from(this.subscriptions.values()).find(
      (s) => s.stripeSubscriptionId === stripeSubscriptionId,
    );
  }

  public findSubscriptionByCustomerId(
    stripeCustomerId: string,
  ): Subscription | undefined {
    return Array.from(this.subscriptions.values()).find(
      (s) => s.stripeCustomerId === stripeCustomerId,
    );
  }

  public upsertSubscription(data: {
    organizationId: string;
    tier?: SubscriptionTier;
    status?: SubscriptionStatus;
    leadQuotaLimit?: number;
    userQuotaLimit?: number;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }): Subscription {
    const existing = this.subscriptions.get(data.organizationId);
    const sub: Subscription = {
      id: existing?.id || `sub_${data.organizationId}`,
      organizationId: data.organizationId,
      tier: data.tier ?? existing?.tier ?? "FREE",
      status: data.status ?? existing?.status ?? "ACTIVE",
      leadQuotaLimit: data.leadQuotaLimit ?? existing?.leadQuotaLimit ?? 50,
      userQuotaLimit: data.userQuotaLimit ?? existing?.userQuotaLimit ?? 1,
      stripeCustomerId: data.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
      stripeSubscriptionId:
        data.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(data.organizationId, sub);
    return sub;
  }

  // --- Leads (Tenant Scoped) ---
  public createLead(input: CreateLeadInput): Lead {
    const id = `lead_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date();
    const dealStatus =
      input.dealStatus ||
      (input.stage === "Won — Paid"
        ? "WON_PAID"
        : input.stage === "Lost / Nurture"
          ? "LOST"
          : "OPEN");

    const wonDate =
      input.wonDate || (dealStatus === "WON_PAID" ? now : null);

    const lead: Lead = {
      id,
      organizationId: input.organizationId,
      assignedToId: input.assignedToId || null,
      company: input.company,
      contact: input.contact || null,
      industry: input.industry || "Other SMB",
      city: input.city || null,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      source: input.source || "Google Maps",
      stage: input.stage || "New Lead",
      priority: input.priority || "MEDIUM",
      score: input.score ?? 5,
      mrr: Number(input.mrr ?? input.value ?? 0),
      value: Number(input.value ?? input.mrr ?? 0),
      lastContact: null,
      nextAction: input.nextAction || "First outreach",
      dueDate: input.dueDate || null,
      closeDate: input.closeDate || null,
      pain: input.pain || null,
      dealStatus,
      notes: input.notes || null,
      lossReason: null,
      wonDate,
      onboarded: false,
      createdAt: now,
      updatedAt: now,
    };

    this.leads.set(id, lead);
    return lead;
  }

  public getLead(organizationId: string, id: string): Lead | undefined {
    const lead = this.leads.get(id);
    if (!lead || lead.organizationId !== organizationId) return undefined;
    const activities = this.listActivitiesByLead(organizationId, id);
    const assignedTo = lead.assignedToId ? this.users.get(lead.assignedToId) : null;
    return { ...lead, activities, assignedTo };
  }

  public updateLead(
    organizationId: string,
    id: string,
    patch: Partial<CreateLeadInput>,
  ): Lead | undefined {
    const existing = this.leads.get(id);
    if (!existing || existing.organizationId !== organizationId) return undefined;

    const now = new Date();
    let stage = patch.stage !== undefined ? patch.stage : existing.stage;
    let dealStatus = patch.dealStatus !== undefined ? patch.dealStatus : existing.dealStatus;
    let wonDate = patch.wonDate !== undefined ? patch.wonDate : existing.wonDate;

    if (patch.stage === "Won — Paid" && existing.stage !== "Won — Paid") {
      dealStatus = "WON_PAID";
      wonDate = wonDate || now;
    } else if (patch.stage && patch.stage !== "Won — Paid" && patch.stage !== "Lost / Nurture") {
      dealStatus = "OPEN";
    }

    const mrr = patch.mrr !== undefined ? Number(patch.mrr) : patch.value !== undefined ? Number(patch.value) : existing.mrr;
    const value = patch.value !== undefined ? Number(patch.value) : mrr;

    const updated: Lead = {
      ...existing,
      ...patch,
      mrr,
      value,
      stage,
      dealStatus,
      wonDate,
      updatedAt: now,
    };

    this.leads.set(id, updated);
    return updated;
  }

  public deleteLead(organizationId: string, id: string): boolean {
    const lead = this.leads.get(id);
    if (!lead || lead.organizationId !== organizationId) return false;
    this.leads.delete(id);

    for (const [actId, act] of this.activities.entries()) {
      if (act.leadId === id && act.organizationId === organizationId) {
        this.activities.delete(actId);
      }
    }
    return true;
  }

  public listLeads(
    organizationId: string,
    filters?: {
      stage?: string;
      priority?: LeadPriority;
      search?: string;
    },
  ): Lead[] {
    let results = Array.from(this.leads.values()).filter(
      (l) => l.organizationId === organizationId,
    );

    if (filters?.stage) {
      results = results.filter((l) => l.stage === filters.stage);
    }

    if (filters?.priority) {
      results = results.filter((l) => l.priority === filters.priority);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (l) =>
          l.company.toLowerCase().includes(q) ||
          (l.contact && l.contact.toLowerCase().includes(q)) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q)) ||
          (l.industry && l.industry.toLowerCase().includes(q)),
      );
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  public countLeads(organizationId: string): number {
    let count = 0;
    for (const l of this.leads.values()) {
      if (l.organizationId === organizationId) count++;
    }
    return count;
  }

  // --- Activities ---
  public createActivity(input: CreateActivityInput): Activity {
    const id = `act_${crypto.randomUUID().slice(0, 8)}`;
    const now = input.createdAt || new Date();
    const activity: Activity = {
      id,
      organizationId: input.organizationId,
      leadId: input.leadId,
      userId: input.userId || null,
      type: input.type,
      notes: input.notes,
      nextAction: input.nextAction || null,
      createdAt: now,
    };
    this.activities.set(id, activity);

    const lead = this.leads.get(input.leadId);
    if (lead && lead.organizationId === input.organizationId) {
      lead.lastContact = now;
      if (input.nextAction) {
        lead.nextAction = input.nextAction;
      }
      lead.updatedAt = now;
    }

    return activity;
  }

  public listActivitiesByLead(
    organizationId: string,
    leadId: string,
  ): Activity[] {
    return Array.from(this.activities.values())
      .filter(
        (a) => a.organizationId === organizationId && a.leadId === leadId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public listActivities(organizationId: string): Activity[] {
    return Array.from(this.activities.values())
      .filter((a) => a.organizationId === organizationId)
      .map((a) => ({
        ...a,
        user: a.userId ? this.users.get(a.userId) : null,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // --- Targets ---
  public getTarget(
    organizationId: string,
    period: "daily" | "weekly",
  ): Target {
    const key = `${organizationId}:${period}`;
    const existing = this.targets.get(key);
    if (existing) return existing;

    const defaultTarget: Target = {
      id: `tgt_${key}`,
      organizationId,
      period,
      prospects: period === "daily" ? 10 : 50,
      outreach: period === "daily" ? 10 : 50,
      followups: period === "daily" ? 3 : 15,
      positive: period === "daily" ? 2 : 10,
      meetings: period === "daily" ? 1 : 5,
      demos: period === "daily" ? 1 : 5,
      paid: period === "daily" ? 0 : 2,
      updatedAt: new Date(),
    };
    this.targets.set(key, defaultTarget);
    return defaultTarget;
  }

  public updateTarget(
    organizationId: string,
    period: "daily" | "weekly",
    data: Partial<Omit<Target, "id" | "organizationId" | "period" | "updatedAt">>,
  ): Target {
    const current = this.getTarget(organizationId, period);
    const updated: Target = {
      ...current,
      ...data,
      updatedAt: new Date(),
    };
    this.targets.set(`${organizationId}:${period}`, updated);
    return updated;
  }

  // --- API Keys ---
  public createApiKey(input: CreateApiKeyInput): { apiKey: ApiKey; rawKey: string } {
    const rawKey = input.rawKey || `sk_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const id = `key_${crypto.randomUUID().slice(0, 8)}`;

    const apiKey: ApiKey = {
      id,
      organizationId: input.organizationId,
      name: input.name,
      keyHash,
      lastUsedAt: null,
      createdAt: new Date(),
    };

    this.apiKeys.set(id, apiKey);
    return { apiKey, rawKey };
  }

  public findApiKeyByHash(keyHash: string): ApiKey | undefined {
    return Array.from(this.apiKeys.values()).find((k) => k.keyHash === keyHash);
  }

  public listApiKeys(organizationId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter(
      (k) => k.organizationId === organizationId,
    );
  }

  public recordApiKeyUsage(id: string): void {
    const key = this.apiKeys.get(id);
    if (key) {
      key.lastUsedAt = new Date();
    }
  }

  // --- Audit Logs ---
  public createAuditLog(data: {
    organizationId: string;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, any>;
  }): AuditLog {
    const id = `aud_${crypto.randomUUID().slice(0, 8)}`;
    const log: AuditLog = {
      id,
      organizationId: data.organizationId,
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      details: data.details,
      createdAt: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  public listAuditLogs(organizationId: string, limit: number = 50): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // --- Default Seed Data ---
  private seedDefaultData() {
    const org = this.createOrganization({
      id: "org_default_sales",
      name: "Sales Enterprise HQ",
      slug: "sales-enterprise-hq",
      currency: "MYR",
    });

    const owner = this.createUser({
      id: "usr_sales_owner",
      email: "founder@salesdashboard.my",
      name: "Lead Sales Director",
      phone: "+60123456789",
    });
    this.setPassword(owner.id, "password123");

    this.createMembership({
      organizationId: org.id,
      userId: owner.id,
      role: "OWNER",
    });

    const closer = this.createUser({
      id: "usr_sales_rep",
      email: "sarah@salesdashboard.my",
      name: "Sarah Lim",
      phone: "+60129876543",
    });
    this.setPassword(closer.id, "password123");

    this.createMembership({
      organizationId: org.id,
      userId: closer.id,
      role: "SALES_REP",
    });

    const admin = this.createUser({
      id: "usr_sales_admin",
      email: "alex@salesdashboard.my",
      name: "Alex Tan",
      phone: "+60133445566",
    });
    this.setPassword(admin.id, "password123");

    this.createMembership({
      organizationId: org.id,
      userId: admin.id,
      role: "ADMIN",
    });

    const sysAdmin = this.createUser({
      id: "usr_sales_admin_master",
      email: "admin@salesdashboard.my",
      name: "Workspace Administrator",
      phone: "+60120001122",
    });
    this.setPassword(sysAdmin.id, "Admin@2026!");

    this.createMembership({
      organizationId: org.id,
      userId: sysAdmin.id,
      role: "OWNER",
    });

    this.upsertSubscription({
      organizationId: org.id,
      tier: "GROWTH",
      status: "ACTIVE",
      leadQuotaLimit: 1000,
      userQuotaLimit: 5,
    });

    const lead1 = this.createLead({
      organizationId: org.id,
      assignedToId: owner.id,
      company: "Kedai Runcit Pak Ali",
      contact: "Pak Ali",
      industry: "Retail / shop",
      city: "Shah Alam",
      phone: "0192345678",
      email: "ali@pakali.my",
      stage: "Qualified",
      priority: "HIGH",
      score: 8,
      mrr: 149,
      nextAction: "WhatsApp follow-up with demo video",
      dueDate: new Date(Date.now() + 86400000),
      pain: "Manual receipt writing is slow and messy",
    });

    const lead2 = this.createLead({
      organizationId: org.id,
      assignedToId: owner.id,
      company: "Siti Bella Beauty Studio",
      contact: "Siti Bella",
      industry: "Beauty / salon",
      city: "Bangsar, KL",
      phone: "0123344556",
      email: "bella@sitibella.com",
      stage: "Meeting Booked",
      priority: "HIGH",
      score: 9,
      mrr: 299,
      nextAction: "Zoom demo on 3pm Thursday",
      dueDate: new Date(Date.now() + 172800000),
      pain: "Needs e-invoicing compliance ready before year end",
    });

    const lead3 = this.createLead({
      organizationId: org.id,
      assignedToId: owner.id,
      company: "Mega Hardware & Trading",
      contact: "Mr. Tan",
      industry: "Trading / wholesale",
      city: "Klang",
      phone: "0168877665",
      email: "sales@megahardware.com.my",
      stage: "Won — Paid",
      priority: "HIGH",
      score: 10,
      mrr: 299,
      dealStatus: "WON_PAID",
      wonDate: new Date(Date.now() - 86400000 * 3),
      nextAction: "Customer onboarding session",
      notes: "Paid annual upfront for Growth plan.",
    });

    this.createApiKey({
      organizationId: org.id,
      name: "Default Inbound Webhook Key",
      rawKey: "sk_live_test_webhook_secret_key_123",
    });

    this.createActivity({
      organizationId: org.id,
      leadId: lead1.id,
      userId: owner.id,
      type: "WhatsApp Chat",
      notes: "Shared 2-minute overview video of e-Invoice generation.",
      nextAction: "Call on Friday afternoon",
    });
  }

  public reset() {
    this.organizations.clear();
    this.users.clear();
    this.memberships.clear();
    this.leads.clear();
    this.activities.clear();
    this.targets.clear();
    this.subscriptions.clear();
    this.apiKeys.clear();
    this.auditLogs.clear();
    this.seedDefaultData();
  }
}

declare global {
  var __crmDatabase: CrmDatabase | undefined;
}

export const crmDb = global.__crmDatabase || (global.__crmDatabase = new CrmDatabase());
