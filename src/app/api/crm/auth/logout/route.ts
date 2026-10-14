import { NextResponse } from "next/server.js";
import { crmDb } from "../../../../../lib/crm/db.ts";
import { getTenantContext } from "../../../../../lib/crm/auth-context.ts";

export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req).catch(() => null);

    if (ctx && ctx.user) {
      crmDb.createAuditLog({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: ctx.userId,
        details: { email: ctx.user.email },
      });
    }

    const res = NextResponse.json({ success: true, message: "Logged out successfully" });

    const expire = "Path=/; SameSite=Lax; Max-Age=0";
    const httpExpire = "Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

    res.headers.append("Set-Cookie", `crm_user_id=; ${httpExpire}`);
    res.headers.append("Set-Cookie", `crm_org_id=; ${httpExpire}`);
    res.headers.append("Set-Cookie", `crm_user_email=; ${expire}`);
    res.headers.append("Set-Cookie", `crm_user_name=; ${expire}`);
    res.headers.append("Set-Cookie", `crm_user_role=; ${expire}`);

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
