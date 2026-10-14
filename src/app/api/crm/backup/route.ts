import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";
import { importSingleFileBackup } from "@/lib/crm/migrate-local-backup.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const leads = tenantService.listLeads(ctx);
    const activities = tenantService.listActivities(ctx);
    const targets = tenantService.getTargets(ctx);

    const backup = {
      version: "invoispro_crm_v2",
      exportedAt: new Date().toISOString(),
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
      },
      leads,
      activities,
      targets,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sales-crm-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();

    const result = await importSingleFileBackup(
      body,
      ctx.organizationId,
      ctx.userId,
    );

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${result.importedLeads} leads and ${result.importedActivities} activities.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
