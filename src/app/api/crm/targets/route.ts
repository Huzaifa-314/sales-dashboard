import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, tenantService } from "@/lib/crm/auth-context.ts";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const targets = tenantService.getTargets(ctx);
    const subscription = ctx.subscription;
    const leads = tenantService.listLeads(ctx);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));

    const activities = tenantService.listActivities(ctx);

    const dailyActuals = {
      prospects: leads.filter((l) => new Date(l.createdAt) >= startOfToday).length,
      outreach: activities.filter((a) => new Date(a.createdAt) >= startOfToday).length,
      followups: activities.filter(
        (a) =>
          new Date(a.createdAt) >= startOfToday &&
          (a.type.includes("Call") || a.type.includes("WhatsApp")),
      ).length,
      meetings: activities.filter(
        (a) => new Date(a.createdAt) >= startOfToday && a.type.includes("Meeting"),
      ).length,
      demos: activities.filter(
        (a) => new Date(a.createdAt) >= startOfToday && a.type.includes("Demo"),
      ).length,
      paid: leads.filter(
        (l) => l.wonDate && new Date(l.wonDate) >= startOfToday,
      ).length,
    };

    const weeklyActuals = {
      prospects: leads.filter((l) => new Date(l.createdAt) >= startOfWeek).length,
      outreach: activities.filter((a) => new Date(a.createdAt) >= startOfWeek).length,
      followups: activities.filter(
        (a) =>
          new Date(a.createdAt) >= startOfWeek &&
          (a.type.includes("Call") || a.type.includes("WhatsApp")),
      ).length,
      meetings: activities.filter(
        (a) => new Date(a.createdAt) >= startOfWeek && a.type.includes("Meeting"),
      ).length,
      demos: activities.filter(
        (a) => new Date(a.createdAt) >= startOfWeek && a.type.includes("Demo"),
      ).length,
      paid: leads.filter(
        (l) => l.wonDate && new Date(l.wonDate) >= startOfWeek,
      ).length,
    };

    return NextResponse.json({
      targets,
      dailyActuals,
      weeklyActuals,
      subscription,
      totalLeads: leads.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();
    const { period, ...data } = body;

    if (period !== "daily" && period !== "weekly") {
      return NextResponse.json(
        { error: "Period must be 'daily' or 'weekly'" },
        { status: 400 },
      );
    }

    const updated = tenantService.updateTargets(ctx, period, data);
    return NextResponse.json({ target: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
