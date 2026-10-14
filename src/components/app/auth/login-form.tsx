"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthHeading, AuthShell } from "@/components/app/auth/auth-shell";
import { AuthNotice, SubmitButton } from "@/components/app/auth/auth-bits";
import { PasswordField } from "@/components/app/auth/password-field";
import { CheckboxField } from "@/components/app/form/fields";
import { useT } from "@/components/app/preferences";
import { TextField } from "@/components/app/text-field";
import type { MessageKey } from "@/i18n/messages";
import { validateLogin } from "@/lib/auth-rules";
import { mockLogin, mockSendEmail } from "@/lib/auth-mock";

const IDS = { email: "login-email", password: "login-password" } as const;

interface DemoPersona {
  role: string;
  name: string;
  email: string;
  pass: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: "Founder",
    name: "Lead Director",
    email: "founder@salesdashboard.my",
    pass: "password123",
  },
  {
    role: "Sales Rep",
    name: "Sarah Lim",
    email: "sarah@salesdashboard.my",
    pass: "password123",
  },
  {
    role: "Admin",
    name: "Alex Tan",
    email: "alex@salesdashboard.my",
    pass: "password123",
  },
];

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const returnUrl = params.get("returnUrl") || "/";

  const [values, setValues] = useState({ email: "", password: "" });
  const [keep, setKeep] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<"invalid" | "unverified" | null>(null);

  const errors = validateLogin(values);
  const shown = (k: keyof typeof errors) =>
    (submitted || touched.has(k)) && errors[k]
      ? t(errors[k] as MessageKey)
      : undefined;
  const touch = (k: string) => setTouched((s) => new Set(s).add(k));

  function selectPersona(persona: DemoPersona) {
    setValues({ email: persona.email, password: persona.pass });
    setProblem(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setProblem(null);
    const first = (["email", "password"] as const).find((k) => errors[k]);
    if (first) {
      document.getElementById(IDS[first])?.focus();
      return;
    }
    setLoading(true);
    const result = await mockLogin(values.email.trim(), values.password);
    setLoading(false);
    if (result === "ok") {
      toast.success(t("auth.loginTitle") + ": Success");
      router.push(returnUrl);
      router.refresh();
      return;
    }
    setProblem(result);
    if (result === "invalid") document.getElementById(IDS.password)?.focus();
  }

  async function resend() {
    await mockSendEmail();
    toast.success(t("auth.resent"));
  }

  return (
    <AuthShell>
      <AuthHeading title={t("auth.loginTitle")} sub={t("auth.loginSub")} />

      {/* Quick Demo Persona Switcher */}
      <div className="mt-4 rounded-control border border-line bg-surface-2 p-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-micro font-medium uppercase tracking-wider text-ink-faint">
            Quick Persona Fill
          </span>
          <span className="text-micro font-medium text-brass">1-Click</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_PERSONAS.map((p) => {
            const isSelected = values.email === p.email;
            return (
              <button
                key={p.email}
                type="button"
                onClick={() => selectPersona(p)}
                className={`flex flex-col items-center justify-center rounded p-2 text-center transition-all ${
                  isSelected
                    ? "border border-line bg-surface font-semibold text-ink shadow-xs"
                    : "text-ink-soft hover:bg-surface/50 hover:text-ink"
                }`}
              >
                <span className="w-full truncate text-caption font-medium">
                  {p.role}
                </span>
                <span className="w-full truncate text-micro text-ink-faint">
                  {p.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {params.get("verified") && !problem && (
        <AuthNotice tone="success">{t("auth.verifiedNotice")}</AuthNotice>
      )}
      {params.get("reset") && !problem && (
        <AuthNotice tone="success">{t("auth.resetDoneNotice")}</AuthNotice>
      )}
      {problem === "invalid" && (
        <AuthNotice tone="error">{t("auth.errInvalid")}</AuthNotice>
      )}
      {problem === "unverified" && (
        <AuthNotice tone="error" title={t("auth.errUnverifiedTitle")}>
          <p>{t("auth.errUnverifiedBody", { email: values.email.trim() })}</p>
          <button
            type="button"
            onClick={resend}
            className="mt-2 min-h-9 font-medium underline underline-offset-4"
          >
            {t("auth.resendLink")}
          </button>
        </AuthNotice>
      )}

      <form noValidate onSubmit={submit} className="auth-form mt-6 grid gap-4">
        <TextField
          id={IDS.email}
          label={t("auth.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("auth.phEmail")}
          value={values.email}
          onChange={(email) => setValues((v) => ({ ...v, email }))}
          onBlur={() => touch("email")}
          error={shown("email")}
        />
        <PasswordField
          id={IDS.password}
          label={t("auth.password")}
          autoComplete="current-password"
          value={values.password}
          onChange={(password) => setValues((v) => ({ ...v, password }))}
          onBlur={() => touch("password")}
          error={shown("password")}
          trailingLabel={
            <Link
              href="/forgot-password"
              className="text-caption font-medium text-ink underline underline-offset-4"
            >
              {t("auth.forgot")}
            </Link>
          }
        />
        <CheckboxField
          label={<span className="text-body">{t("auth.remember")}</span>}
          checked={keep}
          onChange={setKeep}
        />
        <SubmitButton loading={loading}>{t("auth.loginButton")}</SubmitButton>
      </form>

      <p className="mt-6 text-center text-body text-ink-soft">
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-ink underline underline-offset-4"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </AuthShell>
  );
}
