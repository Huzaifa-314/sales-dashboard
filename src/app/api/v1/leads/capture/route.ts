import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { crmDb } from "@/lib/crm/db.ts";
import { checkRateLimit } from "@/lib/crm/rate-limit.ts";
import { sanitizeText } from "@/lib/crm/validation.ts";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid API Key" },
        { status: 401 },
      );
    }

    const rawKey = authHeader.replace("Bearer ", "");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = crmDb.findApiKeyByHash(keyHash);
    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = crmDb.getOrganization(apiKey.organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Rate Limiting (Phase 6: 20 webhook requests / 10s per API Key)
    const rate = checkRateLimit(`webhook:${apiKey.id}`, 20, 10_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 20 requests per 10 seconds." },
        { status: 429 },
      );
    }

    crmDb.recordApiKeyUsage(apiKey.id);

    // Check Quota Limit (Phase 5)
    const subscription = crmDb.getSubscription(organization.id);
    const quotaLimit = subscription?.leadQuotaLimit || 50;
    const currentLeadCount = crmDb.countLeads(organization.id);

    if (currentLeadCount >= quotaLimit) {
      return NextResponse.json(
        { error: "Lead quota exceeded for current subscription plan. Please upgrade to Growth or Enterprise." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const cleanCompany = sanitizeText(body?.company);

    if (!cleanCompany) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    const newLead = crmDb.createLead({
      organizationId: organization.id,
      company: cleanCompany,
      contact: sanitizeText(body.contact),
      email: sanitizeText(body.email),
      phone: sanitizeText(body.phone),
      industry: sanitizeText(body.industry) || "Other SMB",
      city: sanitizeText(body.city),
      pain: sanitizeText(body.pain),
      source: "API Inbound Webhook",
      stage: "New Lead",
      nextAction: "First outreach",
      dueDate: new Date(),
    });

    crmDb.createAuditLog({
      organizationId: organization.id,
      action: "WEBHOOK_LEAD_CAPTURED",
      entityType: "lead",
      entityId: newLead.id,
      details: { company: cleanCompany, apiKeyId: apiKey.id },
    });

    return NextResponse.json(
      { success: true, leadId: newLead.id, company: newLead.company },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
