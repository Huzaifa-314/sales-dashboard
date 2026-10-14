"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthHeading, AuthShell } from "@/components/app/auth/auth-shell";
import { SubmitButton } from "@/components/app/auth/auth-bits";
import { useT } from "@/components/app/preferences";
import { TextField } from "@/components/app/text-field";
import { Button } from "@/components/ui/button";
import type { MessageKey } from "@/i18n/messages";
import { validateEmailOnly } from "@/lib/auth-rules";
import { mockSendEmail } from "@/lib/auth-mock";

const COOLDOWN = 60;
const back =
  "inline-flex min-h-11 items-center gap-1.5 text-body font-medium text-ink underline underline-offset-4";

// Asks for the email and always answers the same way, whether or not an
// account exists, so nobody can use it to find out who is registered.
export function ForgotForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const error = validateEmailOnly(email).email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (error) {
      document.getElementById("forgot-email")?.focus();
      return;
    }
    setLoading(true);
    await mockSendEmail();
    setLoading(false);
    setSentTo(email.trim());
    setWait(COOLDOWN);
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
          {t("auth.forgotSentBody", { email: sentTo })}
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-8 w-full"
          disabled={wait > 0}
          onClick={async () => {
            setWait(COOLDOWN);
            await mockSendEmail();
            toast.success(t("auth.resent"));
          }}
        >
          {wait > 0 ? t("auth.resendIn", { seconds: wait }) : t("auth.resend")}
        </Button>
        <div className="mt-4 flex justify-center">
          <Link href="/login" className={back}>
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading title={t("auth.forgotTitle")} sub={t("auth.forgotSub")} />
      <form noValidate onSubmit={submit} className="auth-form mt-6 grid gap-4">
        <TextField
          id="forgot-email"
          label={t("auth.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("auth.phEmail")}
          value={email}
          onChange={setEmail}
          error={submitted && error ? t(error as MessageKey) : undefined}
        />
        <SubmitButton loading={loading}>{t("auth.sendLink")}</SubmitButton>
      </form>
      <div className="mt-6 flex justify-center">
        <Link href="/login" className={back}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          {t("auth.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
