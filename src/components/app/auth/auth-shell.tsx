"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  Kanban,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Wordmark } from "@/components/app/logo";
import { useLang, useT } from "@/components/app/preferences";
import { Segmented } from "@/components/app/segmented";

// The frame for the pages before login. A desktop gets a brand panel (what the
// product does, with a small picture of it) beside the form; a phone gets the
// form alone. A language switch is always here, since the visitor has not set
// one yet.
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useT();
  const [lang, setLang] = useLang();
  const pillars = [
    { icon: Sparkles, title: t("auth.p1t"), body: t("auth.p1b") },
    { icon: Kanban, title: t("auth.p2t"), body: t("auth.p2b") },
    { icon: ShieldCheck, title: t("auth.p3t"), body: t("auth.p3b") },
  ];
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative isolate hidden flex-col overflow-hidden border-r border-line bg-surface-2 px-12 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen xl:px-16">
        {/* Soft colour behind the content, nothing to read */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 -z-10 size-96 rounded-full bg-brass/10 blur-3xl"
        />
        <div aria-hidden className="auth-ledger absolute inset-0 -z-10" />
        <div aria-hidden className="auth-ripples absolute inset-0 -z-10" />

        <div className="flex h-11 shrink-0 items-center">
          <Wordmark endorsement />
        </div>

        <div className="mt-6 max-w-xl">
          {/* Same height as the spacer above the form title, so the two headings
              start on one line */}
          <p className="micro h-6 text-primary">{t("auth.brandEyebrow")}</p>
          <h2 className="t-hero font-serif leading-tight">
            <span className="block">{t("auth.brandLine1")}</span>
            <span className="block italic text-primary">
              {t("auth.brandLine2")}
            </span>
          </h2>

          {/* The idea in one picture: say it, and the deals are done. */}
          <div
            aria-hidden
            className="mt-8 max-w-md rounded-card border border-line bg-surface p-4 shadow-pop"
          >
            <div className="flex items-center gap-2 text-caption font-medium text-primary">
              <Sparkles size={14} strokeWidth={1.75} />
              {t("auth.aiLabel")}
            </div>
            <p className="ml-auto mt-3 w-fit max-w-[85%] rounded-control bg-surface-2 px-3 py-2 text-body font-medium text-ink">
              {t("auth.chatUser")}
            </p>
            <p className="mt-2 max-w-[92%] text-body text-ink-soft">
              {t("auth.chatAi")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[t("auth.chatReceipt"), t("auth.chatBooks")].map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-chip border border-paid bg-paid-bg px-2 py-0.5 text-caption font-medium text-paid"
                >
                  <Check size={12} strokeWidth={2.5} />
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-3 rounded-control border border-line bg-surface-2 p-3">
              <p className="micro text-ink-soft">{t("auth.chatNeeds")}</p>
              <p className="mt-1 text-body font-medium text-ink">
                {t("auth.chatConfirmQ")}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-control border border-primary bg-primary px-3 py-1 text-caption font-medium text-on-primary">
                  {t("auth.chatConfirm")}
                </span>
                <span className="rounded-control border border-field-border px-3 py-1 text-caption font-medium text-ink">
                  {t("auth.chatChange")}
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-6 flex flex-col gap-4">
            {pillars.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-primary"
                >
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-body font-semibold text-ink">{title}</p>
                  <p className="auth-brand-extra mt-0.5 text-body leading-relaxed text-ink-soft">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col items-start gap-2 pt-6">
          <p className="inline-flex items-center gap-2 rounded-chip border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-brass" />
            {t("auth.founding")}
          </p>
          <a
            href="https://infinitatech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            by Infinita Tech Solutions Sdn. Bhd.
          </a>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-8 lg:min-h-0 lg:py-6">
        <header className="flex h-11 items-center justify-between">
          <span className="lg:invisible">
            <Wordmark endorsement />
          </span>
          <Segmented
            label={t("auth.language")}
            value={lang}
            onChange={setLang}
            options={[
              { id: "en", label: "English" },
              { id: "ms", label: "BM", ariaLabel: "BM, Bahasa Malaysia" },
            ]}
          />
        </header>
        <main
          id="main"
          className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col justify-center py-4 lg:mt-6 lg:justify-start lg:py-0"
        >
          {children}
        </main>
        <footer className="flex justify-center gap-6 text-caption text-ink-soft">
          <Link href="/terms" className="hover:text-ink hover:underline">
            {t("auth.termsName")}
          </Link>
          <Link href="/privacy" className="hover:text-ink hover:underline">
            {t("auth.privacyName")}
          </Link>
        </footer>
      </div>
    </div>
  );
}

// The title and the line under it, the same on every page before login
export function AuthHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      {/* Lines the title up with the brand headline beside it */}
      <div aria-hidden className="hidden h-6 lg:block" />
      <h1 className="t-hero font-serif leading-tight">{title}</h1>
      {sub && <p className="mt-2 text-body text-ink-soft">{sub}</p>}
    </div>
  );
}
