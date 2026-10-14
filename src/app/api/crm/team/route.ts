import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";
import { crmDb } from "@/lib/crm/db.ts";
import type { Role } from "@/lib/crm/types.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const members = tenantService.listMembers(ctx);
    const sub = crmDb.getSubscription(ctx.organizationId);

    return NextResponse.json({
      members,
      userQuotaLimit: sub?.userQuotaLimit || 1,
      total: members.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();
    const { email, name, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const validRoles: Role[] = ["ADMIN", "SALES_REP", "VIEWER"];
    const assignedRole: Role = validRoles.includes(role) ? role : "SALES_REP";

    const member = tenantService.inviteMember(ctx, {
      email,
      name,
      role: assignedRole,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    tenantService.removeMember(ctx, userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
