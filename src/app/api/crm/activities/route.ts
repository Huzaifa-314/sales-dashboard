import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const activities = tenantService.listActivities(ctx);
    return NextResponse.json({ activities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();

    const { leadId, type, notes, nextAction } = body;
    if (!leadId || !type || !notes) {
      return NextResponse.json(
        { error: "leadId, type, and notes are required" },
        { status: 400 },
      );
    }

    const activity = tenantService.logActivity(
      ctx,
      leadId,
      type,
      notes,
      nextAction || null,
    );
    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
