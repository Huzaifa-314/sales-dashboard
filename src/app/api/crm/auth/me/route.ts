import { NextResponse } from "next/server.js";
import { getTenantContext } from "../../../../../lib/crm/auth-context.ts";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
      },
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
        currency: ctx.organization.currency,
      },
      role: ctx.role,
      subscription: {
        tier: ctx.subscription.tier,
        status: ctx.subscription.status,
        leadQuotaLimit: ctx.subscription.leadQuotaLimit,
        userQuotaLimit: ctx.subscription.userQuotaLimit,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status: 401 },
    );
  }
}
