import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";
import { validateLeadInput } from "@/lib/crm/validation.ts";
import { checkRateLimit } from "@/lib/crm/rate-limit.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || undefined;
    const priority = (searchParams.get("priority") as any) || undefined;
    const search = searchParams.get("search") || undefined;

    const leads = tenantService.listLeads(ctx, { stage, priority, search });
    return NextResponse.json({ leads, total: leads.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);

    // Rate Limiting
    const rate = checkRateLimit(`leads_create:${ctx.organizationId}`, 40, 10_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many lead creations in a short window. Please wait." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const validated = validateLeadInput(body);

    const lead = tenantService.createLead(ctx, validated);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err: any) {
    const status = err.message?.includes("quota exceeded") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();
    const { id, ...patch } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 },
      );
    }

    if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);
    if (patch.closeDate) patch.closeDate = new Date(patch.closeDate);
    if (patch.wonDate) patch.wonDate = new Date(patch.wonDate);

    const lead = tenantService.updateLead(ctx, id, patch);
    return NextResponse.json({ lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 },
      );
    }

    tenantService.deleteLead(ctx, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
