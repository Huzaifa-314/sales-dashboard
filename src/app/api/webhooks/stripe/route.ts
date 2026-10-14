import { NextRequest, NextResponse } from "next/server";
import { crmDb } from "@/lib/crm/db.ts";
import { CRM_PLANS, type SubscriptionTier } from "@/lib/crm/types.ts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.type;

    if (!eventType) {
      return NextResponse.json(
        { error: "Invalid Stripe event structure" },
        { status: 400 },
      );
    }

    switch (eventType) {
      case "checkout.session.completed": {
        const session = body.data?.object;
        const organizationId = session?.metadata?.organizationId;
        if (!organizationId) {
          return NextResponse.json(
            { error: "Missing organizationId in session metadata" },
            { status: 400 },
          );
        }

        const tierRaw = (session.metadata?.tier || "GROWTH").toUpperCase();
        const tier: SubscriptionTier =
          tierRaw in CRM_PLANS ? (tierRaw as SubscriptionTier) : "GROWTH";
        const plan = CRM_PLANS[tier];

        const updated = crmDb.upsertSubscription({
          organizationId,
          stripeCustomerId: session.customer || `cus_${Date.now()}`,
          stripeSubscriptionId: session.subscription || `sub_${Date.now()}`,
          tier: plan.tier,
          status: "ACTIVE",
          leadQuotaLimit: plan.leadQuotaLimit,
          userQuotaLimit: plan.userQuotaLimit,
        });

        crmDb.createAuditLog({
          organizationId,
          action: "STRIPE_SUBSCRIPTION_ACTIVATED",
          entityType: "subscription",
          entityId: updated.id,
          details: {
            tier: plan.tier,
            stripeSubscriptionId: session.subscription,
            leadQuotaLimit: plan.leadQuotaLimit,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = body.data?.object;
        const stripeSubId = subscription?.id;
        if (!stripeSubId) {
          return NextResponse.json(
            { error: "Missing subscription ID" },
            { status: 400 },
          );
        }

        const existingSub = crmDb.findSubscriptionByStripeId(stripeSubId);
        if (existingSub) {
          crmDb.upsertSubscription({
            organizationId: existingSub.organizationId,
            tier: "FREE",
            status: "CANCELED",
            leadQuotaLimit: 50,
            userQuotaLimit: 1,
          });

          crmDb.createAuditLog({
            organizationId: existingSub.organizationId,
            action: "STRIPE_SUBSCRIPTION_CANCELED",
            entityType: "subscription",
            entityId: existingSub.id,
            details: { stripeSubscriptionId: stripeSubId },
          });
        }
        break;
      }

      default:
        // Ignore unhandled events with 200 OK
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
