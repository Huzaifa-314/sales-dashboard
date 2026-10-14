import { crmDb } from "./db.ts";
import { assertPermission } from "./rbac.ts";
import {
  CRM_PLANS,
  type Role,
  type User,
  type Organization,
  type Subscription,
  type SubscriptionTier,
  type Lead,
  type Activity,
  type Target,
  type ApiKey,
  type LeadPriority,
  type CreateLeadInput,
  type Membership,
  type AuditLog,
} from "./types.ts";

export interface TenantContext {
  userId: string;
  user: User;
  organizationId: string;
  organization: Organization;
  role: Role;
  subscription: Subscription;
}

export async function getTenantContext(req?: Request): Promise<TenantContext> {
  let orgId = "org_default_sales";
  let userId = "usr_sales_owner";

  if (req) {
    const headerOrg = req.headers.get("x-organization-id");
    const headerUser = req.headers.get("x-user-id");
    if (headerOrg) orgId = headerOrg;
    if (headerUser) userId = headerUser;

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const pairs = cookieHeader.split(";").map((p) => p.trim());
      for (const pair of pairs) {
        const [k, ...v] = pair.split("=");
        const key = k?.trim();
        const val = decodeURIComponent(v.join("="));
        if (key === "crm_user_id" && val) userId = val;
        if (key === "crm_org_id" && val) orgId = val;
      }
    }
  }

  let org = crmDb.getOrganization(orgId);
  if (!org) {
    org = crmDb.createOrganization({
      id: orgId,
      name: "Sales Enterprise HQ",
      slug: orgId,
    });
  }

  let user = crmDb.getUser(userId);
  if (!user) {
    user = crmDb.createUser({
      id: userId,
      email: `${userId}@salesdashboard.my`,
      name: "Lead Sales Manager",
    });
  }

  let membership = crmDb.getMembership(org.id, user.id);
  if (!membership) {
    membership = crmDb.createMembership({
      organizationId: org.id,
      userId: user.id,
      role: "OWNER",
    });
  }

  let sub = crmDb.getSubscription(org.id);
  if (!sub) {
    sub = crmDb.upsertSubscription({
      organizationId: org.id,
      tier: "FREE",
      leadQuotaLimit: 50,
      userQuotaLimit: 1,
    });
  }

  return {
    userId: user.id,
    user,
    organizationId: org.id,
    organization: org,
    role: membership.role,
    subscription: sub,
  };
}

export const tenantService = {
  listLeads(
    ctx: TenantContext,
    filters?: { stage?: string; priority?: LeadPriority; search?: string },
  ): Lead[] {
    assertPermission(ctx.role, "view_leads");
    return crmDb.listLeads(ctx.organizationId, filters);
  },

  getLead(ctx: TenantContext, leadId: string): Lead | undefined {
    assertPermission(ctx.role, "view_leads");
    return crmDb.getLead(ctx.organizationId, leadId);
  },

  createLead(
    ctx: TenantContext,
    data: Omit<CreateLeadInput, "organizationId">,
  ): Lead {
    assertPermission(ctx.role, "create_leads");

    const currentCount = crmDb.countLeads(ctx.organizationId);
    if (currentCount >= ctx.subscription.leadQuotaLimit) {
      throw new Error(
        `Lead quota exceeded (${currentCount}/${ctx.subscription.leadQuotaLimit}). Please upgrade your plan.`,
      );
    }

    const { assignedToId, ...rest } = data;
    const lead = crmDb.createLead({
      ...rest,
      organizationId: ctx.organizationId,
      assignedToId: assignedToId || ctx.userId,
    });

    crmDb.createAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "LEAD_CREATED",
      entityType: "lead",
      entityId: lead.id,
      details: { company: lead.company, mrr: lead.mrr, stage: lead.stage },
    });

    return lead;
  },

  updateLead(
    ctx: TenantContext,
    leadId: string,
    patch: Partial<CreateLeadInput>,
  ): Lead {
    assertPermission(ctx.role, "edit_leads");
    const existing = crmDb.getLead(ctx.organizationId, leadId);
    if (!existing) {
      throw new Error(`Lead ${leadId} not found or access denied.`);
    }

    const updated = crmDb.updateLead(ctx.organizationId, leadId, patch);
    if (!updated) {
      throw new Error(`Lead ${leadId} not found or access denied.`);
    }

    if (patch.stage && patch.stage !== existing.stage) {
      crmDb.createAuditLog({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: "STAGE_CHANGED",
        entityType: "lead",
        entityId: leadId,
        details: { from: existing.stage, to: patch.stage, company: existing.company },
      });
    }

    return updated;
  },

  deleteLead(ctx: TenantContext, leadId: string): boolean {
    assertPermission(ctx.role, "delete_leads");
    const existing = crmDb.getLead(ctx.organizationId, leadId);
    if (!existing) {
      throw new Error(`Lead ${leadId} not found or access denied.`);
    }

    const ok = crmDb.deleteLead(ctx.organizationId, leadId);
    if (!ok) {
      throw new Error(`Lead ${leadId} not found or access denied.`);
    }

    crmDb.createAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "LEAD_DELETED",
      entityType: "lead",
      entityId: leadId,
      details: { company: existing.company },
    });

    return true;
  },

  logActivity(
    ctx: TenantContext,
    leadId: string,
    type: string,
    notes: string,
    nextAction?: string | null,
  ): Activity {
    assertPermission(ctx.role, "log_activities");
    const act = crmDb.createActivity({
      organizationId: ctx.organizationId,
      leadId,
      userId: ctx.userId,
      type,
      notes,
      nextAction,
    });

    crmDb.createAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "ACTIVITY_LOGGED",
      entityType: "activity",
      entityId: act.id,
      details: { leadId, type, nextAction },
    });

    return act;
  },

  listActivities(ctx: TenantContext): Activity[] {
    assertPermission(ctx.role, "view_leads");
    return crmDb.listActivities(ctx.organizationId);
  },

  getTargets(ctx: TenantContext): { daily: Target; weekly: Target } {
    assertPermission(ctx.role, "view_leads");
    return {
      daily: crmDb.getTarget(ctx.organizationId, "daily"),
      weekly: crmDb.getTarget(ctx.organizationId, "weekly"),
    };
  },

  updateTargets(
    ctx: TenantContext,
    period: "daily" | "weekly",
    data: Partial<Omit<Target, "id" | "organizationId" | "period" | "updatedAt">>,
  ): Target {
    assertPermission(ctx.role, "edit_targets");
    return crmDb.updateTarget(ctx.organizationId, period, data);
  },

  listApiKeys(ctx: TenantContext): ApiKey[] {
    assertPermission(ctx.role, "manage_api_keys");
    return crmDb.listApiKeys(ctx.organizationId);
  },

  createApiKey(ctx: TenantContext, name: string): { apiKey: ApiKey; rawKey: string } {
    assertPermission(ctx.role, "manage_api_keys");
    return crmDb.createApiKey({
      organizationId: ctx.organizationId,
      name,
    });
  },

  // --- Phase 5: Billing & Monetization ---
  upgradeSubscription(ctx: TenantContext, tier: SubscriptionTier): Subscription {
    assertPermission(ctx.role, "manage_billing");
    const plan = CRM_PLANS[tier];
    if (!plan) {
      throw new Error(`Invalid plan tier: ${tier}`);
    }

    const updated = crmDb.upsertSubscription({
      organizationId: ctx.organizationId,
      tier,
      status: "ACTIVE",
      leadQuotaLimit: plan.leadQuotaLimit,
      userQuotaLimit: plan.userQuotaLimit,
    });

    crmDb.createAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "PLAN_UPGRADED",
      entityType: "subscription",
      entityId: updated.id,
      details: { tier, leadQuotaLimit: plan.leadQuotaLimit, userQuotaLimit: plan.userQuotaLimit },
    });

    return updated;
  },

  // --- Phase 6: Team Management & Audit Logs ---
  listMembers(ctx: TenantContext): Membership[] {
    assertPermission(ctx.role, "view_leads");
    return crmDb.listMemberships(ctx.organizationId);
  },

  inviteMember(
    ctx: TenantContext,
    data: { email: string; name?: string; role: Role },
  ): Membership {
    assertPermission(ctx.role, "invite_members");

    const currentCount = crmDb.countMemberships(ctx.organizationId);
    if (currentCount >= ctx.subscription.userQuotaLimit) {
      throw new Error(
        `User seat quota exceeded (${currentCount}/${ctx.subscription.userQuotaLimit}). Upgrade your plan to invite more members.`,
      );
    }

    const user = crmDb.createUser({
      email: data.email.toLowerCase().trim(),
      name: data.name?.trim() || null,
    });

    const membership = crmDb.createMembership({
      organizationId: ctx.organizationId,
      userId: user.id,
      role: data.role,
    });

    crmDb.createAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "MEMBER_INVITED",
      entityType: "membership",
      entityId: membership.id,
      details: { email: data.email, role: data.role },
    });

    return membership;
  },

  removeMember(ctx: TenantContext, targetUserId: string): boolean {
    assertPermission(ctx.role, "invite_members");
    if (targetUserId === ctx.userId) {
      throw new Error("You cannot remove yourself as workspace owner.");
    }

    const targetMembership = crmDb.getMembership(ctx.organizationId, targetUserId);
    if (!targetMembership) {
      throw new Error("Member not found in this organization.");
    }

    if (targetMembership.role === "OWNER") {
      throw new Error("Cannot remove workspace owner.");
    }

    const ok = crmDb.deleteMembership(ctx.organizationId, targetUserId);
    if (ok) {
      crmDb.createAuditLog({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: "MEMBER_REMOVED",
        entityType: "membership",
        entityId: targetUserId,
      });
    }
    return ok;
  },

  listAuditLogs(ctx: TenantContext, limit?: number): AuditLog[] {
    assertPermission(ctx.role, "view_leads");
    return crmDb.listAuditLogs(ctx.organizationId, limit);
  },
};
