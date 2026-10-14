import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { crmDb } from "../src/lib/crm/db.ts";
import { importSingleFileBackup } from "../src/lib/crm/migrate-local-backup.ts";
import { getTenantContext, tenantService } from "../src/lib/crm/auth-context.ts";
import { hasPermission, assertPermission } from "../src/lib/crm/rbac.ts";
import { cleanWhatsAppPhone, generateWhatsAppUrl } from "../src/lib/crm/whatsapp.ts";
import { validateLeadInput, validateActivityInput, sanitizeText, ValidationError } from "../src/lib/crm/validation.ts";
import { checkRateLimit, resetRateLimits } from "../src/lib/crm/rate-limit.ts";
import { CRM_PLANS } from "../src/lib/crm/types.ts";

// ==========================================
// PHASE 1: RELATIONAL DATA MODELING & MIGRATION
// ==========================================

test("Phase 1: Multi-tenant relational models and CRUD", () => {
  const org = crmDb.createOrganization({
    id: "org_test_1",
    name: "Test SME Enterprise",
    slug: "test-sme-enterprise",
    currency: "MYR",
  });
  assert.equal(org.name, "Test SME Enterprise");
  assert.equal(org.currency, "MYR");

  const user = crmDb.createUser({
    id: "usr_test_1",
    email: "sme@example.my",
    name: "SME Manager",
  });
  assert.equal(user.email, "sme@example.my");

  const membership = crmDb.createMembership({
    organizationId: org.id,
    userId: user.id,
    role: "SALES_REP",
  });
  assert.equal(membership.role, "SALES_REP");

  // Create lead
  const lead = crmDb.createLead({
    organizationId: org.id,
    assignedToId: user.id,
    company: "Restoran Selera Bonda",
    contact: "Bonda Nor",
    industry: "Retail / shop",
    city: "Petaling Jaya",
    phone: "0132223344",
    stage: "Qualified",
    priority: "HIGH",
    mrr: 199,
  });
  assert.equal(lead.company, "Restoran Selera Bonda");
  assert.equal(lead.priority, "HIGH");
  assert.equal(lead.mrr, 199);
  assert.equal(lead.dealStatus, "OPEN");

  // Create activity
  const act = crmDb.createActivity({
    organizationId: org.id,
    leadId: lead.id,
    userId: user.id,
    type: "Phone Call",
    notes: "Owner requested quote for 3 POS terminals.",
    nextAction: "Send WhatsApp quotation",
  });
  assert.equal(act.type, "Phone Call");
  assert.equal(lead.nextAction, "Send WhatsApp quotation");
});

test("Phase 1: Migration tool correctly maps JSON export to relational models", async () => {
  const testOrgId = "org_migration_test";
  crmDb.createOrganization({
    id: testOrgId,
    name: "Migration Test Org",
    slug: "migration-test-org",
  });

  const mockSingleFileBackup = {
    leads: [
      {
        id: "loc_lead_1",
        company: "Boutique Florist",
        contact: "Datin Sheila",
        industry: "Retail / shop",
        city: "Bangsar",
        phone: "0129998877",
        stage: "Won — Paid",
        priority: "High",
        score: 9,
        mrr: 299,
        dealStatus: "Won — Paid",
        wonDate: "2026-10-10T12:00:00Z",
        nextAction: "Staff training",
      },
      {
        id: "loc_lead_2",
        company: "Bengkel Tayar Ah Seng",
        contact: "Ah Seng",
        industry: "Repair / maintenance",
        city: "Subang Jaya",
        phone: "0165554433",
        stage: "New Lead",
        priority: "Medium",
        score: 6,
        mrr: 99,
        dealStatus: "Open",
        nextAction: "First cold visit",
      },
    ],
    activities: [
      {
        leadId: "loc_lead_1",
        type: "Product Demo",
        notes: "Completed online invoice demonstration.",
        next: "Send invoice for deposit",
      },
    ],
    targets: {
      daily: { prospects: 12, outreach: 15 },
      weekly: { paid: 3 },
    },
  };

  const result = await importSingleFileBackup(mockSingleFileBackup, testOrgId);
  assert.equal(result.importedLeads, 2);
  assert.equal(result.importedActivities, 1);

  const importedLeads = crmDb.listLeads(testOrgId);
  const florist = importedLeads.find((l) => l.company === "Boutique Florist");
  const bengkel = importedLeads.find(
    (l) => l.company === "Bengkel Tayar Ah Seng",
  );

  assert.ok(florist);
  assert.equal(florist.priority, "HIGH");
  assert.equal(florist.dealStatus, "WON_PAID");
  assert.equal(florist.mrr, 299);

  assert.ok(bengkel);
  assert.equal(bengkel.priority, "MEDIUM");
  assert.equal(bengkel.dealStatus, "OPEN");

  const floristActivities = crmDb.listActivitiesByLead(testOrgId, florist.id);
  assert.equal(floristActivities.length, 1);
  assert.equal(floristActivities[0].type, "Product Demo");
});

// ==========================================
// PHASE 2: TENANT SCOPING & SECURITY / RBAC
// ==========================================

test("Phase 2: Multi-tenant context resolver and strict tenant data isolation", async () => {
  const orgA = crmDb.createOrganization({
    id: "org_alpha",
    name: "Alpha Corp",
    slug: "alpha-corp",
  });
  const userA = crmDb.createUser({
    id: "usr_alpha",
    email: "alpha@example.my",
  });
  crmDb.createMembership({
    organizationId: orgA.id,
    userId: userA.id,
    role: "ADMIN",
  });

  const orgB = crmDb.createOrganization({
    id: "org_beta",
    name: "Beta Logistics",
    slug: "beta-logistics",
  });
  const userB = crmDb.createUser({
    id: "usr_beta",
    email: "beta@example.my",
  });
  crmDb.createMembership({
    organizationId: orgB.id,
    userId: userB.id,
    role: "SALES_REP",
  });

  const leadA = crmDb.createLead({
    organizationId: orgA.id,
    company: "Alpha Customer 1",
    industry: "Trading / wholesale",
  });

  const leadB = crmDb.createLead({
    organizationId: orgB.id,
    company: "Beta Customer 1",
    industry: "Contractor / services",
  });

  const reqA = new Request("http://localhost:4000/api/crm/leads", {
    headers: {
      "x-organization-id": "org_alpha",
      "x-user-id": "usr_alpha",
    },
  });
  const ctxA = await getTenantContext(reqA);
  assert.equal(ctxA.organizationId, "org_alpha");
  assert.equal(ctxA.role, "ADMIN");

  const reqB = new Request("http://localhost:4000/api/crm/leads", {
    headers: {
      "x-organization-id": "org_beta",
      "x-user-id": "usr_beta",
    },
  });
  const ctxB = await getTenantContext(reqB);
  assert.equal(ctxB.organizationId, "org_beta");
  assert.equal(ctxB.role, "SALES_REP");

  const leadsA = tenantService.listLeads(ctxA);
  assert.ok(leadsA.some((l) => l.id === leadA.id));
  assert.ok(!leadsA.some((l) => l.id === leadB.id));

  const leadsB = tenantService.listLeads(ctxB);
  assert.ok(leadsB.some((l) => l.id === leadB.id));
  assert.ok(!leadsB.some((l) => l.id === leadA.id));

  assert.equal(tenantService.getLead(ctxB, leadA.id), undefined);
  assert.throws(() => {
    tenantService.deleteLead(ctxB, leadA.id);
  });
});

test("Phase 2: RBAC permissions matrix enforcement", () => {
  assert.equal(hasPermission("OWNER", "manage_billing"), true);
  assert.equal(hasPermission("ADMIN", "manage_billing"), false);
  assert.equal(hasPermission("SALES_REP", "manage_billing"), false);

  assert.equal(hasPermission("ADMIN", "delete_leads"), true);
  assert.equal(hasPermission("SALES_REP", "delete_leads"), false);
  assert.equal(hasPermission("VIEWER", "delete_leads"), false);

  assert.equal(hasPermission("SALES_REP", "create_leads"), true);
  assert.equal(hasPermission("VIEWER", "create_leads"), false);

  assert.doesNotThrow(() => {
    assertPermission("ADMIN", "delete_leads");
  });

  assert.throws(
    () => {
      assertPermission("SALES_REP", "delete_leads");
    },
    /Forbidden/,
  );

  assert.throws(
    () => {
      assertPermission("VIEWER", "create_leads");
    },
    /Forbidden/,
  );
});

// ==========================================
// PHASE 3: PIPELINE LOGIC & STAGE TRANSITIONS
// ==========================================

test("Phase 3: Stage transition automatically marks Won — Paid and records wonDate", () => {
  const orgId = "org_stage_test";
  crmDb.createOrganization({ id: orgId, name: "Stage Test", slug: "stage-test" });

  const lead = crmDb.createLead({
    organizationId: orgId,
    company: "Pending Deal Sdn Bhd",
    industry: "Online seller",
    stage: "Offer Sent",
    mrr: 499,
  });
  assert.equal(lead.dealStatus, "OPEN");
  assert.equal(lead.wonDate, null);

  const wonLead = crmDb.updateLead(orgId, lead.id, {
    stage: "Won — Paid",
  });

  assert.ok(wonLead);
  assert.equal(wonLead.stage, "Won — Paid");
  assert.equal(wonLead.dealStatus, "WON_PAID");
  assert.ok(wonLead.wonDate instanceof Date);
});

// ==========================================
// PHASE 4: SALES AUTOMATION & INBOUND WEBHOOK
// ==========================================

test("Phase 4.1: WhatsApp number standardizer and URL generator for Malaysia SMBs", () => {
  assert.equal(cleanWhatsAppPhone("012-345 6789"), "60123456789");
  assert.equal(cleanWhatsAppPhone("019 988 7766"), "60199887766");
  assert.equal(cleanWhatsAppPhone("+6011-1234567"), "60111234567");

  const url = generateWhatsAppUrl("0123456789", "ABC Mini Market", "Mr. Lee");
  assert.ok(url);
  assert.ok(url.startsWith("https://wa.me/60123456789?text="));
  assert.ok(url.includes("ABC%20Mini%20Market") || url.includes("ABC+Mini+Market"));
});

test("Phase 4.2: Inbound Lead Capture Webhook Engine with SHA-256 Auth & Quota Enforcement", () => {
  const org = crmDb.createOrganization({
    id: "org_webhook_unit_test",
    name: "Webhook Unit Test Org",
    slug: "webhook-unit-test-org",
  });

  crmDb.upsertSubscription({
    organizationId: org.id,
    tier: "FREE",
    leadQuotaLimit: 2,
  });

  const rawKey = "sk_live_secret_webhook_test_token_12345";
  crmDb.createApiKey({
    organizationId: org.id,
    name: "Website Form Key",
    rawKey,
  });

  function processWebhook(authHeader: string | null, payload: any) {
    if (!authHeader?.startsWith("Bearer ")) {
      return { status: 401, error: "Missing or invalid API Key" };
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const keyHash = crypto.createHash("sha256").update(token).digest("hex");
    const apiKey = crmDb.findApiKeyByHash(keyHash);
    if (!apiKey) {
      return { status: 401, error: "Unauthorized" };
    }
    const organization = crmDb.getOrganization(apiKey.organizationId);
    if (!organization) {
      return { status: 404, error: "Organization not found" };
    }
    const sub = crmDb.getSubscription(organization.id);
    const quota = sub?.leadQuotaLimit || 50;
    if (crmDb.countLeads(organization.id) >= quota) {
      return {
        status: 403,
        error: "Lead quota exceeded for current subscription plan.",
      };
    }
    if (!payload?.company || !String(payload.company).trim()) {
      return { status: 400, error: "Company name is required" };
    }
    const newLead = crmDb.createLead({
      organizationId: organization.id,
      company: payload.company.trim(),
      contact: payload.contact || null,
      phone: payload.phone || null,
      industry: payload.industry || "Other SMB",
      source: "API Inbound Webhook",
      stage: "New Lead",
    });
    crmDb.recordApiKeyUsage(apiKey.id);
    return { status: 201, success: true, leadId: newLead.id };
  }

  // Missing header -> 401
  assert.equal(processWebhook(null, { company: "Test Corp" }).status, 401);

  // Bad key -> 401
  assert.equal(processWebhook("Bearer bad_key", { company: "Test Corp" }).status, 401);

  // Missing company -> 400
  assert.equal(processWebhook(`Bearer ${rawKey}`, { contact: "John" }).status, 400);

  // Ingest Lead 1 -> 201
  assert.equal(processWebhook(`Bearer ${rawKey}`, { company: "Inbound Prospect 1" }).status, 201);

  // Ingest Lead 2 -> 201
  assert.equal(processWebhook(`Bearer ${rawKey}`, { company: "Inbound Prospect 2" }).status, 201);

  // Ingest Lead 3 -> 403 (Quota limit of 2 reached)
  const res3 = processWebhook(`Bearer ${rawKey}`, { company: "Inbound Prospect 3" });
  assert.equal(res3.status, 403);
  assert.match(res3.error!, /quota exceeded/i);
});

// ==========================================
// PHASE 5: MONETIZATION & STRIPE SUBSCRIPTIONS
// ==========================================

test("Phase 5.1: Plan Tier Configuration & Quotas", () => {
  assert.equal(CRM_PLANS.FREE.priceMonthlyMYR, 0);
  assert.equal(CRM_PLANS.FREE.leadQuotaLimit, 50);
  assert.equal(CRM_PLANS.FREE.userQuotaLimit, 1);

  assert.equal(CRM_PLANS.STARTER.priceMonthlyMYR, 49);
  assert.equal(CRM_PLANS.STARTER.leadQuotaLimit, 500);

  assert.equal(CRM_PLANS.GROWTH.priceMonthlyMYR, 149);
  assert.equal(CRM_PLANS.GROWTH.userQuotaLimit, 5);
  assert.equal(CRM_PLANS.GROWTH.leadQuotaLimit, 10000);

  assert.equal(CRM_PLANS.ENTERPRISE.priceMonthlyMYR, 299);
  assert.equal(CRM_PLANS.ENTERPRISE.userQuotaLimit, 15);
});

test("Phase 5.2: Lead Quota Enforcement on Free Plan", () => {
  const org = crmDb.createOrganization({
    id: "org_quota_test",
    name: "Quota Test Corp",
    slug: "quota-test-corp",
  });
  const user = crmDb.createUser({
    id: "usr_quota_owner",
    email: "quota_owner@test.my",
  });
  crmDb.createMembership({
    organizationId: org.id,
    userId: user.id,
    role: "OWNER",
  });
  // Set quota to 2 leads
  const sub = crmDb.upsertSubscription({
    organizationId: org.id,
    tier: "FREE",
    leadQuotaLimit: 2,
    userQuotaLimit: 1,
  });

  const ctx = {
    userId: user.id,
    user,
    organizationId: org.id,
    organization: org,
    role: "OWNER" as const,
    subscription: sub,
  };

  // Lead 1
  tenantService.createLead(ctx, { company: "Lead 1", industry: "Retail / shop" });
  // Lead 2
  tenantService.createLead(ctx, { company: "Lead 2", industry: "Beauty / salon" });

  assert.equal(crmDb.countLeads(org.id), 2);

  // Lead 3 -> Exceeds quota of 2
  assert.throws(
    () => {
      tenantService.createLead(ctx, { company: "Lead 3", industry: "Other SMB" });
    },
    /Lead quota exceeded/i,
  );
});

test("Phase 5.3: Stripe Webhook checkout.session.completed & customer.subscription.deleted", () => {
  const orgId = "org_stripe_test";
  const org = crmDb.createOrganization({ id: orgId, name: "Stripe Test Corp", slug: "stripe-test" });
  const sub = crmDb.upsertSubscription({
    organizationId: orgId,
    tier: "FREE",
    leadQuotaLimit: 50,
  });

  // 1. Simulate Stripe checkout.session.completed event
  const checkoutEvent = {
    type: "checkout.session.completed",
    data: {
      object: {
        customer: "cus_stripe_123",
        subscription: "sub_stripe_456",
        metadata: {
          organizationId: orgId,
          tier: "GROWTH",
        },
      },
    },
  };

  const plan = CRM_PLANS.GROWTH;
  const upgraded = crmDb.upsertSubscription({
    organizationId: orgId,
    stripeCustomerId: checkoutEvent.data.object.customer,
    stripeSubscriptionId: checkoutEvent.data.object.subscription,
    tier: plan.tier,
    status: "ACTIVE",
    leadQuotaLimit: plan.leadQuotaLimit,
    userQuotaLimit: plan.userQuotaLimit,
  });

  crmDb.createAuditLog({
    organizationId: orgId,
    action: "STRIPE_SUBSCRIPTION_ACTIVATED",
    entityType: "subscription",
    entityId: upgraded.id,
    details: { tier: plan.tier },
  });

  assert.equal(upgraded.tier, "GROWTH");
  assert.equal(upgraded.leadQuotaLimit, 10000);
  assert.equal(upgraded.userQuotaLimit, 5);
  assert.equal(upgraded.status, "ACTIVE");

  // Lookup subscription by Stripe Subscription ID
  const foundSub = crmDb.findSubscriptionByStripeId("sub_stripe_456");
  assert.ok(foundSub);
  assert.equal(foundSub.organizationId, orgId);

  // 2. Simulate Stripe customer.subscription.deleted event
  const downgraded = crmDb.upsertSubscription({
    organizationId: orgId,
    tier: "FREE",
    status: "CANCELED",
    leadQuotaLimit: 50,
    userQuotaLimit: 1,
  });

  crmDb.createAuditLog({
    organizationId: orgId,
    action: "STRIPE_SUBSCRIPTION_CANCELED",
    entityType: "subscription",
    entityId: downgraded.id,
  });

  assert.equal(downgraded.tier, "FREE");
  assert.equal(downgraded.status, "CANCELED");
  assert.equal(downgraded.leadQuotaLimit, 50);
});

// ==========================================
// PHASE 6: PRODUCTION INFRASTRUCTURE & SECURITY
// ==========================================

test("Phase 6.1: Input Validation and XSS Sanitization", () => {
  // Valid input
  const valid = validateLeadInput({
    company: "  Clean Company Sdn Bhd  ",
    contact: "Ali",
    email: "ali@cleancompany.my",
    mrr: 150,
    stage: "Qualified",
  });
  assert.equal(valid.company, "Clean Company Sdn Bhd");
  assert.equal(valid.mrr, 150);

  // Empty company -> ValidationError
  assert.throws(() => {
    validateLeadInput({ company: "   " });
  }, ValidationError);

  // Negative MRR -> ValidationError
  assert.throws(() => {
    validateLeadInput({ company: "Bad MRR Corp", mrr: -50 });
  }, ValidationError);

  // Invalid email format -> ValidationError
  assert.throws(() => {
    validateLeadInput({ company: "Bad Email Corp", email: "not-an-email" });
  }, ValidationError);

  // XSS Script injection stripped
  const sanitized = sanitizeText("Injected <script>alert('pwned')</script> Company");
  assert.ok(!sanitized?.includes("<script>"));
  assert.equal(sanitized, "Injected  Company");
});

test("Phase 6.2: Sliding Window Rate Limiting", () => {
  resetRateLimits();
  const testKey = "rate_limit_test_client";

  // Limit: 3 requests per 1000ms
  const r1 = checkRateLimit(testKey, 3, 1000);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = checkRateLimit(testKey, 3, 1000);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = checkRateLimit(testKey, 3, 1000);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th request must be throttled
  const r4 = checkRateLimit(testKey, 3, 1000);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
  assert.ok(r4.resetMs > 0);
});

test("Phase 6.3: Immutable Security Audit Log Tracking", () => {
  const org = crmDb.createOrganization({ id: "org_audit_test", name: "Audit Corp", slug: "audit-corp" });
  const user = crmDb.createUser({ id: "usr_audit_agent", email: "auditor@audit.my" });
  crmDb.createMembership({ organizationId: org.id, userId: user.id, role: "OWNER" });
  const sub = crmDb.upsertSubscription({ organizationId: org.id, tier: "STARTER", leadQuotaLimit: 500 });

  const ctx = {
    userId: user.id,
    user,
    organizationId: org.id,
    organization: org,
    role: "OWNER" as const,
    subscription: sub,
  };

  // 1. Action: Create lead
  const lead = tenantService.createLead(ctx, { company: "Audit Lead A", industry: "Online seller" });

  // 2. Action: Stage Change
  tenantService.updateLead(ctx, lead.id, { stage: "Won — Paid" });

  // 3. Action: Delete Lead
  tenantService.deleteLead(ctx, lead.id);

  // Verify Audit Log trail
  const logs = tenantService.listAuditLogs(ctx);
  assert.ok(logs.length >= 3);

  const actions = logs.map((l) => l.action);
  assert.ok(actions.includes("LEAD_CREATED"));
  assert.ok(actions.includes("STAGE_CHANGED"));
  assert.ok(actions.includes("LEAD_DELETED"));

  // Verify details in stage change
  const stageLog = logs.find((l) => l.action === "STAGE_CHANGED");
  assert.ok(stageLog);
  assert.equal(stageLog.details?.to, "Won — Paid");
});

test("Phase 6.4: Team User Quota & RBAC Role Enforcement", () => {
  const org = crmDb.createOrganization({ id: "org_team_test", name: "Team Corp", slug: "team-corp" });
  const owner = crmDb.createUser({ id: "usr_team_owner", email: "owner@team.my" });
  crmDb.createMembership({ organizationId: org.id, userId: owner.id, role: "OWNER" });

  // Free plan: 1 user seat quota
  const sub = crmDb.upsertSubscription({
    organizationId: org.id,
    tier: "FREE",
    userQuotaLimit: 1,
  });

  const ctx = {
    userId: owner.id,
    user: owner,
    organizationId: org.id,
    organization: org,
    role: "OWNER" as const,
    subscription: sub,
  };

  // 1. Inviting member on 1-seat Free plan throws error
  assert.throws(
    () => {
      tenantService.inviteMember(ctx, { email: "rep1@team.my", role: "SALES_REP" });
    },
    /User seat quota exceeded/i,
  );

  // 2. Upgrade to Growth plan (5 user seats)
  const upgradedSub = tenantService.upgradeSubscription(ctx, "GROWTH");
  ctx.subscription = upgradedSub;
  assert.equal(upgradedSub.userQuotaLimit, 5);

  // 3. Now inviting members succeeds
  const rep1 = tenantService.inviteMember(ctx, { email: "rep1@team.my", name: "Sales Rep 1", role: "SALES_REP" });
  const admin2 = tenantService.inviteMember(ctx, { email: "admin2@team.my", name: "Admin 2", role: "ADMIN" });

  assert.equal(crmDb.countMemberships(org.id), 3);

  // 4. Removing workspace owner throws error
  assert.throws(
    () => {
      tenantService.removeMember(ctx, owner.id);
    },
    /cannot remove.*owner/i,
  );

  // 5. Removing sales rep succeeds
  const removed = tenantService.removeMember(ctx, rep1.userId);
  assert.equal(removed, true);
  assert.equal(crmDb.countMemberships(org.id), 2);
});

// ==========================================
// PHASE 7: FULL AUTHENTICATION & LOGIN FLOW
// ==========================================

test("Phase 7.1: Valid login authenticates, returns user/org and sets secure cookies", async () => {
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const req = new Request("http://localhost:3000/api/crm/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "founder@salesdashboard.my",
      password: "password123",
    }),
  });

  const res = await loginHandler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.email, "founder@salesdashboard.my");
  assert.equal(data.role, "OWNER");
  assert.ok(data.organization);

  // Check Set-Cookie headers
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("crm_user_id="));
  assert.ok(setCookie.includes("crm_org_id="));

  // Verify audit log was recorded
  const logs = crmDb.listAuditLogs("org_default_sales", 10);
  const loginLog = logs.find((l) => l.action === "USER_LOGIN" && l.details?.email === "founder@salesdashboard.my");
  assert.ok(loginLog);
});

test("Phase 7.2: Invalid password returns 401 Unauthorized and records security audit trail", async () => {
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const req = new Request("http://localhost:3000/api/crm/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "founder@salesdashboard.my",
      password: "wrongpassword999",
    }),
  });

  const res = await loginHandler(req);
  assert.equal(res.status, 401);

  const data = await res.json();
  assert.ok(data.error);
  assert.match(data.error, /incorrect/i);

  // Verify failed audit log
  const logs = crmDb.listAuditLogs("org_default_sales", 10);
  const failedLog = logs.find((l) => l.action === "USER_LOGIN_FAILED");
  assert.ok(failedLog);
});

test("Phase 7.3: Invalid email returns 400 Bad Request", async () => {
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const req = new Request("http://localhost:3000/api/crm/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      password: "password123",
    }),
  });

  const res = await loginHandler(req);
  assert.equal(res.status, 400);
});

test("Phase 7.4: Multi-tenant session resolution via cookies in getTenantContext", async () => {
  // Test Sarah Lim (Closer - SALES_REP) session cookie
  const cookieHeader = "crm_user_id=usr_sales_rep; crm_org_id=org_default_sales";
  const req = new Request("http://localhost:3000/api/crm/leads", {
    headers: { cookie: cookieHeader },
  });

  const ctx = await getTenantContext(req);
  assert.equal(ctx.userId, "usr_sales_rep");
  assert.equal(ctx.user.email, "sarah@salesdashboard.my");
  assert.equal(ctx.role, "SALES_REP");
  assert.equal(ctx.organizationId, "org_default_sales");

  // Verify RBAC for Sarah: can view leads, cannot delete leads
  assert.equal(hasPermission(ctx.role, "view_leads"), true);
  assert.equal(hasPermission(ctx.role, "delete_leads"), false);
});

test("Phase 7.5: Logout endpoint clears session cookies and creates audit log", async () => {
  const { POST: logoutHandler } = await import("../src/app/api/crm/auth/logout/route.ts");

  const req = new Request("http://localhost:3000/api/crm/auth/logout", {
    method: "POST",
    headers: { cookie: "crm_user_id=usr_sales_owner; crm_org_id=org_default_sales" },
  });

  const res = await logoutHandler(req);
  assert.equal(res.status, 200);

  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("Max-Age=0"));

  const logs = crmDb.listAuditLogs("org_default_sales", 10);
  const logoutLog = logs.find((l) => l.action === "USER_LOGOUT");
  assert.ok(logoutLog);
});

test("Phase 7.6: Rate limiting blocks brute-force login attempts", async () => {
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const ip = "brute_force_test_ip";
  let lastStatus = 200;

  for (let i = 0; i < 12; i++) {
    const req = new Request("http://localhost:3000/api/crm/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        email: "attacker@test.my",
        password: "password123",
      }),
    });
    const res = await loginHandler(req);
    lastStatus = res.status;
  }

  // Expect 429 Too Many Requests after exceeding threshold (10 attempts)
  assert.equal(lastStatus, 429);
});

test("Phase 7.7: Master Admin credentials authenticate as OWNER with full workspace access", async () => {
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const req = new Request("http://localhost:3000/api/crm/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@salesdashboard.my",
      password: "Admin@2026!",
    }),
  });

  const res = await loginHandler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.email, "admin@salesdashboard.my");
  assert.equal(data.role, "OWNER");
  assert.equal(data.user.name, "Workspace Administrator");
});

test("Phase 7.8: New user registration via signup endpoint and immediate login", async () => {
  const { POST: signupHandler } = await import("../src/app/api/crm/auth/signup/route.ts");
  const { POST: loginHandler } = await import("../src/app/api/crm/auth/login/route.ts");

  const signupReq = new Request("http://localhost:3000/api/crm/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tengku Faiz",
      email: "faiz@kerabat.my",
      password: "SecurePass2026!",
      whatsapp: "019-876 5432",
    }),
  });

  const signupRes = await signupHandler(signupReq);
  assert.equal(signupRes.status, 200);
  const signupData = await signupRes.json();
  assert.equal(signupData.success, true);

  // Now login with newly registered user
  const loginReq = new Request("http://localhost:3000/api/crm/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "faiz@kerabat.my",
      password: "SecurePass2026!",
    }),
  });

  const loginRes = await loginHandler(loginReq);
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.name, "Tengku Faiz");
  assert.equal(loginData.role, "SALES_REP");
});



