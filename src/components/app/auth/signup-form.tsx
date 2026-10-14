"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthHeading, AuthShell } from "@/components/app/auth/auth-shell";
import {
  AuthNotice,
  PasswordRules,
  SubmitButton,
} from "@/components/app/auth/auth-bits";
import { PasswordField } from "@/components/app/auth/password-field";
import { CheckboxField } from "@/components/app/form/fields";
import { useT } from "@/components/app/preferences";
import { TextField } from "@/components/app/text-field";
import { Button } from "@/components/ui/button";
import type { MessageKey } from "@/i18n/messages";
import {
  normaliseMyMobile,
  validateSignup,
  type SignupValues,
} from "@/lib/auth-rules";
import { mockSendEmail, mockSignup } from "@/lib/auth-mock";

const IDS = {
  name: "signup-name",
  email: "signup-email",
  password: "signup-password",
  confirm: "signup-confirm",
  whatsapp: "signup-whatsapp",
  terms: "signup-terms",
} as const;
const ORDER = [
  "name",
  "email",
  "password",
  "confirm",
  "whatsapp",
  "terms",
] as const;
const COOLDOWN = 60;

const empty: SignupValues = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  whatsapp: "",
  terms: false,
};

const link = "font-medium text-ink underline underline-offset-4";

// Design only for now: lib/auth-mock.ts stands in for the account service.
// After a valid form the person sees "Check your email"; the real account, the
// verification email and its resend limits arrive with the backend.
export function SignupForm() {
  const t = useT();
  const [values, setValues] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  // Resend is locked for a minute after each send
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const errors = validateSignup(values);
  const set = (patch: Partial<SignupValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setExists(false);
  };
  const touch = (k: string) => setTouched((s) => new Set(s).add(k));
  const shown = (k: keyof typeof errors) =>
    (submitted || touched.has(k)) && errors[k]
      ? t(errors[k] as MessageKey)
      : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      document.getElementById(IDS[first])?.focus();
      return;
    }
    setLoading(true);
    const result = await mockSignup(values.email.trim());
    setLoading(false);
    if (result === "exists") {
      setExists(true);
      document.getElementById(IDS.email)?.focus();
      return;
    }
    setSentTo(values.email.trim());
    setWait(COOLDOWN);
  }

  async function resend() {
    setWait(COOLDOWN);
    await mockSendEmail();
    toast.success(t("auth.resent"));
  }

  if (sentTo) {
    return (
      <AuthShell>
        <span
          aria-hidden
          className="mb-6 flex size-14 items-center justify-center rounded-full border border-line bg-surface-2 text-primary"
        >
          <MailCheck size={26} strokeWidth={1.5} />
        </span>
        <h1 className="t-hero font-serif leading-tight">
          {t("auth.checkTitle")}
        </h1>
        <p className="mt-3 text-body text-ink-soft" role="status">
          {t("auth.checkBody", { email: sentTo })}
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-8 w-full"
          disabled={wait > 0}
          onClick={resend}
        >
          {wait > 0 ? t("auth.resendIn", { seconds: wait }) : t("auth.resend")}
        </Button>
        <div className="mt-4 flex flex-col items-center gap-1 text-body">
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="min-h-11 text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            {t("auth.wrongEmail")}
          </button>
          <Link href="/login" className={`flex min-h-11 items-center ${link}`}>
            {t("auth.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  const mobile = normaliseMyMobile(values.whatsapp);

  return (
    <AuthShell>
      <AuthHeading title={t("auth.signupTitle")} sub={t("auth.signupSub")} />

      {exists && (
        <AuthNotice tone="error" title={t("auth.errExists")}>
          <p>
            <Link href="/login" className={link}>
              {t("auth.loginButton")}
            </Link>
            {" · "}
            <Link href="/forgot-password" className={link}>
              {t("auth.forgot")}
            </Link>
          </p>
        </AuthNotice>
      )}

      <form noValidate onSubmit={submit} className="auth-form mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={IDS.name}
            label={t("auth.name")}
            autoComplete="name"
            placeholder={t("auth.phName")}
            value={values.name}
            onChange={(name) => set({ name })}
            onBlur={() => touch("name")}
            error={shown("name")}
          />
          <TextField
            id={IDS.whatsapp}
            label={t("auth.whatsapp")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-345 6789"
            value={values.whatsapp}
            onChange={(whatsapp) => set({ whatsapp })}
            onBlur={() => touch("whatsapp")}
            error={shown("whatsapp")}
            hint={mobile ?? undefined}
          />
          <p className="-mt-2 text-caption text-ink-soft sm:col-span-2">
            {t("auth.whatsappHint")}
          </p>
        </div>
        <TextField
          id={IDS.email}
          label={t("auth.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("auth.phEmail")}
          value={values.email}
          onChange={(email) => set({ email })}
          onBlur={() => touch("email")}
          error={shown("email")}
        />
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id={IDS.password}
              label={t("auth.password")}
              autoComplete="new-password"
              value={values.password}
              onChange={(password) => set({ password })}
              onBlur={() => touch("password")}
              error={shown("password")}
            />
            <PasswordField
              id={IDS.confirm}
              label={t("auth.confirmPassword")}
              autoComplete="new-password"
              value={values.confirm}
              onChange={(confirm) => set({ confirm })}
              onBlur={() => touch("confirm")}
              error={shown("confirm")}
            />
          </div>
          <PasswordRules value={values.password} />
        </div>
        <div>
          <CheckboxField
            id={IDS.terms}
            label={
              <span className="py-2 text-caption leading-snug text-ink-soft">
                {t("auth.agreeA")}
                <Link href="/terms" className={link} target="_blank">
                  {t("auth.termsName")}
                </Link>
                {t("auth.agreeB")}
                <Link href="/privacy" className={link} target="_blank">
                  {t("auth.privacyName")}
                </Link>
                {t("auth.agreeC")}
              </span>
            }
            checked={values.terms}
            onChange={(terms) => {
              set({ terms });
              touch("terms");
            }}
          />
          {shown("terms") && (
            <p className="mt-1 text-caption text-overdue">{shown("terms")}</p>
          )}
        </div>
        <SubmitButton loading={loading}>{t("auth.signupButton")}</SubmitButton>
      </form>

      <p className="mt-6 text-center text-body text-ink-soft">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className={link}>
          {t("auth.loginButton")}
        </Link>
      </p>
    </AuthShell>
  );
}
