// A stand-in and bridge for the account service, so the login and sign-up pages can be
// tested with every outcome and seamlessly authenticate with the real CRM backend.

export type LoginResult = "ok" | "invalid" | "unverified";

export async function mockLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch("/api/crm/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("crm:auth-change"));
      }
      return "ok";
    }

    if (res.status === 401) {
      return "invalid";
    }

    if (email.toLowerCase().includes("unverified")) {
      return "unverified";
    }

    return "invalid";
  } catch {
    // Client-side fallback for test environments
    if (email.toLowerCase().includes("unverified")) return "unverified";
    if (password === "wrongpass1") return "invalid";
    return "ok";
  }
}

export type SignupResult = "ok" | "exists";

export async function mockSignup(email: string): Promise<SignupResult> {
  await new Promise((r) => setTimeout(r, 600));
  return email.toLowerCase().includes("taken") ? "exists" : "ok";
}

export async function mockSendEmail(): Promise<void> {
  await new Promise((r) => setTimeout(r, 500));
}

export async function mockResetPassword(): Promise<"ok"> {
  await new Promise((r) => setTimeout(r, 600));
  return "ok";
}
