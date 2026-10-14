import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 50;

    const auditLogs = tenantService.listAuditLogs(ctx, limit);
    return NextResponse.json({ auditLogs, total: auditLogs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
