import { NextResponse } from "next/server.js";
import { crmDb } from "../../../../../lib/crm/db.ts";
import { sanitizeText } from "../../../../../lib/crm/validation.ts";
import { normaliseMyMobile } from "../../../../../lib/auth-rules.ts";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = body.email;
    const rawPassword = body.password;
    const rawName = body.name;
    const rawWhatsapp = body.whatsapp;

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid business email address." },
        { status: 400 },
      );
    }

    if (!rawPassword || typeof rawPassword !== "string" || rawPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with a letter and a number." },
        { status: 400 },
      );
    }

    const email = (sanitizeText(rawEmail) || rawEmail.trim()).toLowerCase();
    const name = sanitizeText(rawName) || "Sales Executive";
    const phone = rawWhatsapp ? normaliseMyMobile(rawWhatsapp) || rawWhatsapp : undefined;

    // Check if user already exists
    const existing = crmDb.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 },
      );
    }

    // Create user in CRM database
    const user = crmDb.createUser({
      email,
      name,
      phone,
    });
    crmDb.setPassword(user.id, rawPassword);

    // Assign to sales workspace as SALES_REP
    crmDb.createMembership({
      organizationId: "org_default_sales",
      userId: user.id,
      role: "SALES_REP",
    });

    crmDb.createAuditLog({
      organizationId: "org_default_sales",
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email, name: user.name, phone },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    console.error("Signup error", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
