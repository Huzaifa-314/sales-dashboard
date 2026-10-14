import { NextResponse } from "next/server.js";
import { crmDb } from "../../../../../lib/crm/db.ts";
import { checkRateLimit } from "../../../../../lib/crm/rate-limit.ts";
import { sanitizeText } from "../../../../../lib/crm/validation.ts";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local_client";
    const rateCheck = checkRateLimit(`login_${ip}`, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute before trying again." },
        { status: 429, headers: { "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString() } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = body.email;
    const rawPassword = body.password;

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid business email address." },
        { status: 400 },
      );
    }

    if (!rawPassword || typeof rawPassword !== "string" || rawPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const email = (sanitizeText(rawEmail) || rawEmail.trim()).toLowerCase();
    const password = rawPassword;

    let user = crmDb.findUserByEmail(email);

    if (!user) {
      // In demo/cloud environment, if a new reviewer logs in, auto-provision their account with sales workspace
      const name = email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      user = crmDb.createUser({
        email,
        name: name || "Sales Executive",
      });
      crmDb.setPassword(user.id, password);

      crmDb.createMembership({
        organizationId: "org_default_sales",
        userId: user.id,
        role: "SALES_REP",
      });
    } else {
      const isValid = crmDb.verifyPassword(user.id, password);
      if (!isValid) {
        crmDb.createAuditLog({
          organizationId: "org_default_sales",
          userId: user.id,
          action: "USER_LOGIN_FAILED",
          entityType: "User",
          entityId: user.id,
          details: { email, reason: "Incorrect credentials", ip },
        });

        return NextResponse.json(
          { error: "Incorrect email or password. Please try again." },
          { status: 401 },
        );
      }
    }

    // Resolve membership & organization
    const membership =
      crmDb.getUserMembership(user.id) ||
      crmDb.getMembership("org_default_sales", user.id);
    const orgId = membership?.organizationId || "org_default_sales";
    const org = crmDb.getOrganization(orgId) || crmDb.getOrganization("org_default_sales");

    // Record successful audit trail
    crmDb.createAuditLog({
      organizationId: orgId,
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email, role: membership?.role || "SALES_REP", ip },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: org?.id || orgId,
        name: org?.name || "Sales Enterprise HQ",
      },
      role: membership?.role || "SALES_REP",
    });

    const cookieOpts = "Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"; // 30 days
    const clientOpts = "Path=/; SameSite=Lax; Max-Age=2592000";

    res.headers.append("Set-Cookie", `crm_user_id=${encodeURIComponent(user.id)}; ${cookieOpts}`);
    res.headers.append("Set-Cookie", `crm_org_id=${encodeURIComponent(orgId)}; ${cookieOpts}`);
    res.headers.append("Set-Cookie", `crm_user_email=${encodeURIComponent(user.email)}; ${clientOpts}`);
    res.headers.append("Set-Cookie", `crm_user_name=${encodeURIComponent(user.name || "")}; ${clientOpts}`);
    res.headers.append("Set-Cookie", `crm_user_role=${encodeURIComponent(membership?.role || "SALES_REP")}; ${clientOpts}`);

    return res;
  } catch (err: any) {
    console.error("Login error", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during sign-in." },
      { status: 500 },
    );
  }
}
