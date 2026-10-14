"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeading, AuthShell } from "@/components/app/auth/auth-shell";
import { PasswordRules, SubmitButton } from "@/components/app/auth/auth-bits";
import { PasswordField } from "@/components/app/auth/password-field";
import { useT } from "@/components/app/preferences";
import type { MessageKey } from "@/i18n/messages";
import { validateReset } from "@/lib/auth-rules";
import { mockResetPassword } from "@/lib/auth-mock";

// The page the reset link opens: a new password, then back to login with a
// confirmation. The link's token is checked by the backend when it exists.
export function ResetForm() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const errors = validateReset({ password, confirm });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const first = errors.password
      ? "reset-password"
      : errors.confirm
        ? "reset-confirm"
        : null;
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setLoading(true);
    await mockResetPassword();
    router.push("/login?reset=1");
  }

  return (
    <AuthShell>
      <AuthHeading title={t("auth.resetTitle")} sub={t("auth.resetSub")} />
      <form noValidate onSubmit={submit} className="auth-form mt-6 grid gap-4">
        <PasswordField
          id="reset-password"
          label={t("auth.newPassword")}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={
            submitted && errors.password
              ? t(errors.password as MessageKey)
              : undefined
          }
          below={<PasswordRules value={password} />}
        />
        <PasswordField
          id="reset-confirm"
          label={t("auth.confirmPassword")}
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={
            submitted && errors.confirm
              ? t(errors.confirm as MessageKey)
              : undefined
          }
        />
        <SubmitButton loading={loading}>{t("auth.resetButton")}</SubmitButton>
      </form>
    </AuthShell>
  );
}
