"use client";

import type { ReactNode } from "react";
import { Check, CircleAlert, Loader2, MailCheck, Minus } from "lucide-react";
import { useT } from "@/components/app/preferences";
import { passwordChecks } from "@/lib/auth-rules";
import { Button } from "@/components/ui/button";

// A message above the form: something went wrong (red), something went right
// (green) or something to know (neutral). Errors are announced at once.
export function AuthNotice({
  tone,
  title,
  children,
}: {
  tone: "error" | "success" | "info";
  title?: string;
  children?: ReactNode;
}) {
  const style = {
    error: "border-overdue bg-overdue-bg text-overdue",
    success: "border-paid bg-paid-bg text-paid",
    info: "border-line bg-surface-2 text-ink",
  }[tone];
  const Icon =
    tone === "error" ? CircleAlert : tone === "success" ? Check : MailCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mt-6 flex gap-3 rounded-control border px-4 py-3 text-body ${style}`}
    >
      <Icon
        size={18}
        strokeWidth={1.75}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-1" : ""}>{children}</div>}
      </div>
    </div>
  );
}

// The main button of a form: shows it is working, and cannot be pressed twice.
export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <Button
      type="submit"
      size="lg"
      className="mt-2 w-full"
      disabled={loading}
      aria-busy={loading}
    >
      {loading && (
        <Loader2
          size={18}
          strokeWidth={1.75}
          aria-hidden
          className="animate-spin"
        />
      )}
      {children}
      {loading && <span className="sr-only">{t("auth.working")}</span>}
    </Button>
  );
}

// The password rules. Before anything is typed it is one plain line; while
// typing, each rule gets a tick when met and a dash when not, so it never looks
// like something to click.
export function PasswordRules({ value }: { value: string }) {
  const t = useT();
  if (!value)
    return (
      <p className="mt-2 text-caption text-ink-soft">
        {t("auth.passwordHint")}
      </p>
    );
  const c = passwordChecks(value);
  const rows = [
    { ok: c.length, label: t("auth.rule8") },
    { ok: c.letter, label: t("auth.ruleLetter") },
    { ok: c.number, label: t("auth.ruleNumber") },
  ];
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {rows.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1 text-caption ${r.ok ? "text-paid" : "text-ink-soft"}`}
        >
          {r.ok ? (
            <Check size={14} strokeWidth={2.5} aria-hidden />
          ) : (
            <Minus size={14} strokeWidth={2} aria-hidden />
          )}
          <span>{r.label}</span>
          <span className="sr-only">
            {r.ok ? ", met" : ", not yet met"}
          </span>
        </li>
      ))}
    </ul>
  );
}
