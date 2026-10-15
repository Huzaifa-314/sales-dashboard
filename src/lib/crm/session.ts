import crypto from "node:crypto";

const SESSION_COOKIE = "crm_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

interface SessionData {
  userId: string;
  organizationId: string;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.CRM_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CRM_SESSION_SECRET must be at least 32 characters");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSession(userId: string, organizationId: string): string {
  const data: SessionData = {
    userId,
    organizationId,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(req: Request): SessionData | null {
  const cookie = req.headers.get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const actual = Buffer.from(signature, "base64url");
  const expected = Buffer.from(sign(payload), "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionData;
    if (!data.userId || !data.organizationId || !Number.isFinite(data.expiresAt)) return null;
    if (data.expiresAt <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
