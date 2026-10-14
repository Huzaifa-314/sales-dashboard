import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";
import { crmDb } from "@/lib/crm/db.ts";
import { CRM_PLANS, type SubscriptionTier } from "@/lib/crm/types.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const sub = crmDb.getSubscription(ctx.organizationId);
    const currentLeads = crmDb.countLeads(ctx.organizationId);
    const currentMembers = crmDb.countMemberships(ctx.organizationId);
    const plan = CRM_PLANS[sub?.tier || "FREE"];

    return NextResponse.json({
      subscription: sub,
      plan,
      usage: {
        leadsUsed: currentLeads,
        leadsLimit: sub?.leadQuotaLimit || 50,
        leadsRemaining: Math.max(0, (sub?.leadQuotaLimit || 50) - currentLeads),
        usersUsed: currentMembers,
        usersLimit: sub?.userQuotaLimit || 1,
      },
      availablePlans: Object.values(CRM_PLANS),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();
    const tier = (body.tier || "").toUpperCase() as SubscriptionTier;

    if (!CRM_PLANS[tier]) {
      return NextResponse.json(
        { error: `Invalid plan tier: ${body.tier}` },
        { status: 400 },
      );
    }

    const updated = tenantService.upgradeSubscription(ctx, tier);
    const plan = CRM_PLANS[tier];

    return NextResponse.json({
      success: true,
      subscription: updated,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
