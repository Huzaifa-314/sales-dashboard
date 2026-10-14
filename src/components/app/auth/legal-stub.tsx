"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/app/auth/auth-shell";
import { useT } from "@/components/app/preferences";

// Terms and Privacy Policy: the links must exist, but the text is for the
// lawyers to write. Until then each page says so plainly.
export function LegalStub({ kind }: { kind: "terms" | "privacy" }) {
  const t = useT();
  return (
    <AuthShell>
      <AuthHeading
        title={t(kind === "terms" ? "auth.termsName" : "auth.privacyName")}
        sub={t("auth.legalSoon")}
      />
      <Link
        href="/signup"
        className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-body font-medium text-ink underline underline-offset-4"
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
        {t("auth.createAccount")}
      </Link>
    </AuthShell>
  );
}
