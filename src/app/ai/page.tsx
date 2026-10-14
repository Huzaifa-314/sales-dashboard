"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Section } from "@/components/app/card";
import { formatMoney } from "@/components/app/money";
import { PageHeader } from "@/components/app/page-header";
import { useLang, useT } from "@/components/app/preferences";
import { StatusLabel, type Tone } from "@/components/app/status-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers } from "@/lib/customers-store";
import {
  ask,
  parseLog,
  reviewEntry,
  useAiLogRaw,
  usePaymentRule,
  type LogEntry,
} from "@/lib/ask-store";
import type { MessageKey } from "@/i18n/messages";

const statusView: Record<
  LogEntry["status"],
  { tone: Tone; label: MessageKey }
> = {
  done: { tone: "settled", label: "ai.stDone" },
  draft: { tone: "owing", label: "ai.stDraft" },
  waiting: { tone: "partly", label: "ai.stWaiting" },
  cancelled: { tone: "settled", label: "ai.stCancelled" },
};

// The control room for the AI: say something, see what is waiting for you, what
// it noticed, what it did, and what it may do alone. The Ask panel (any page)
// is where the saying happens; this page is where you look back and decide.
export default function AiPage() {
  const t = useT();
  const [lang] = useLang();
  const customers = useCustomers();
  const raw = useAiLogRaw();
  const log = useMemo(() => parseLog(raw), [raw]);
  const [rule, setRule] = usePaymentRule();
  const [text, setText] = useState("");

  const when = new Intl.DateTimeFormat(lang === "ms" ? "ms-MY" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    ask.open(text);
    setText("");
  }

  // What it noticed: worked out from the same customers as the rest of the app
  const late = customers.filter((c) => c.overdue > 0);
  const lateTotal = late.reduce((s, c) => s + c.overdue, 0);
  const withCredit = [...customers]
    .filter((c) => c.credit > 0)
    .sort((a, b) => b.credit - a.credit)[0];
  const noPhone = customers.filter((c) => c.outstanding > 0 && !c.phone);

  const notices: { id: string; text: string; action: React.ReactNode }[] = [];
  if (late.length > 0)
    notices.push({
      id: "late",
      text:
        late.length === 1
          ? t("ai.nOverdueOne", { amount: formatMoney(lateTotal) })
          : t("ai.nOverdue", {
              count: late.length,
              amount: formatMoney(lateTotal),
            }),
      action: (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => ask.open(t("ask.exOverdue"))}
        >
          {t("ai.show")}
        </Button>
      ),
    });
  if (withCredit)
    notices.push({
      id: "credit",
      text: t("ai.nCredit", {
        name: withCredit.name,
        amount: formatMoney(withCredit.credit),
      }),
      action: (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/customers/${withCredit.id}`}>{t("ai.open")}</Link>
        </Button>
      ),
    });
  if (noPhone.length > 0)
    notices.push({
      id: "phone",
      text:
        noPhone.length === 1
          ? t("ai.nNoPhoneOne")
          : t("ai.nNoPhone", { count: noPhone.length }),
      action: (
        <Button asChild size="sm" variant="secondary">
          <Link href="/customers">{t("ai.open")}</Link>
        </Button>
      ),
    });

  const waiting = log.filter((e) => e.status === "waiting");
  const history = log.filter((e) => e.status !== "waiting").slice(0, 10);

  const examples = [t("ask.ex1"), t("ask.ex2"), t("ask.ex3")];

  return (
    <AppShell>
      <PageHeader title={t("ai.title")} subtitle={t("ai.sub")} />

      <form
        role="search"
        aria-label={t("ai.title")}
        onSubmit={submit}
        className="mt-6"
      >
        <label htmlFor="ai-page-input" className="sr-only">
          {t("ask.placeholder")}
        </label>
        <Input
          id="ai-page-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("ask.placeholder")}
          boxClassName="min-h-[46px]"
          icon={
            <Sparkles
              size={18}
              strokeWidth={1.5}
              aria-hidden
              className="shrink-0 text-primary"
            />
          }
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask.open(s)}
            className="min-h-9 rounded-control border border-line bg-surface px-3 text-caption text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title={t("ai.confirmTitle")}>
          {waiting.length === 0 ? (
            <p className="px-5 py-5 text-body text-ink-soft">
              {t("ai.confirmEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {waiting.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body font-medium text-ink">
                      {e.summary}
                    </span>
                    <span className="text-caption text-ink-soft">
                      {when.format(e.at)}
                    </span>
                  </span>
                  <Button size="sm" onClick={() => reviewEntry(e)}>
                    {t("ask.review")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("ai.noticedTitle")}>
          {notices.length === 0 ? (
            <p className="px-5 py-5 text-body text-ink-soft">
              {t("ai.noticedEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {notices.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <span className="min-w-0 text-body text-ink">{n.text}</span>
                  <span className="shrink-0">{n.action}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section title={t("ai.historyTitle")}>
          {history.length === 0 ? (
            <p className="px-5 py-5 text-body text-ink-soft">
              {t("ai.historyEmpty")}
            </p>
          ) : (
            <ul
              aria-label={t("ai.historyLabel")}
              className="divide-y divide-line"
            >
              {history.map((e) => {
                const v = statusView[e.status];
                return (
                  <li key={e.id}>
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-2 transition-colors duration-150 hover:bg-surface-2/60">
                        <span className="min-w-0">
                          <span className="block truncate text-body text-ink">
                            {e.summary}
                          </span>
                          <span className="text-caption text-ink-soft">
                            {when.format(e.at)}
                          </span>
                        </span>
                        <StatusLabel tone={v.tone} label={t(v.label)} />
                      </summary>
                      <dl className="grid gap-1 px-5 pb-4 text-caption sm:grid-cols-[140px_1fr]">
                        <dt className="text-ink-soft">{t("ai.hSaid")}</dt>
                        <dd className="text-ink">“{e.said}”</dd>
                        <dt className="text-ink-soft">{t("ai.hUnderstood")}</dt>
                        <dd className="text-ink">{e.summary}</dd>
                        <dt className="text-ink-soft">{t("ai.hSure")}</dt>
                        <dd className="num text-ink">{e.sure}%</dd>
                        <dt className="text-ink-soft">{t("ai.hResult")}</dt>
                        <dd className="text-ink">{t(v.label)}</dd>
                      </dl>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section title={t("ai.rulesTitle")}>
          <ul className="divide-y divide-line">
            <li className="flex min-h-14 items-center justify-between gap-4 px-5 py-2 text-body">
              <span className="text-ink">{t("ai.ruleDrafts")}</span>
              <span className="text-ink-soft">{t("ai.ruleDraftsVal")}</span>
            </li>
            <li className="flex min-h-14 items-center justify-between gap-4 px-5 py-2 text-body">
              <span className="text-ink">{t("ai.rulePay")}</span>
              <Select
                value={rule}
                onValueChange={(v) => setRule(v as "ask" | "do")}
              >
                <SelectTrigger aria-label={t("ai.rulePay")} className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="ask">{t("ai.rulePayAsk")}</SelectItem>
                  <SelectItem value="do">{t("ai.rulePayDo")}</SelectItem>
                </SelectContent>
              </Select>
            </li>
            <li className="flex min-h-14 items-center justify-between gap-4 px-5 py-2 text-body">
              <span className="text-ink">{t("ai.ruleSensitive")}</span>
              <span className="text-ink-soft">{t("ai.ruleSensitiveVal")}</span>
            </li>
          </ul>
        </Section>
      </div>
    </AppShell>
  );
}
