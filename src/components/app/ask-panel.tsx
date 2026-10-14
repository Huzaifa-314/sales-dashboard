"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Hint } from "@/components/app/hint";
import { formatMoney } from "@/components/app/money";
import { useT } from "@/components/app/preferences";
import { useReminders } from "@/components/app/use-remind";
import { Button, buttonClass } from "@/components/ui/button";
import { interpret, type Card } from "@/lib/ai-mock";
import { ask, aiLog, newId, useAsk, type Msg } from "@/lib/ask-store";
import type { MessageKey } from "@/i18n/messages";
import { addCustomer, useCustomers } from "@/lib/customers-store";

// ---- The button in the top bar ----

export function AskButton() {
  const t = useT();
  const { open } = useAsk();
  return (
    <Hint label={t("ask.hint")}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => ask.toggle()}
        className={buttonClass(
          "secondary",
          "sm",
          "min-h-10 gap-1.5 border-primary px-3 text-body text-primary",
        )}
      >
        <Sparkles size={18} strokeWidth={1.5} aria-hidden />
        <span>{t("ask.button")}</span>
        <span className="sr-only"> AI</span>
      </button>
    </Hint>
  );
}

// ---- Cards ----

const sensitiveTitle: Record<
  Extract<Card, { type: "sensitive" }>["action"],
  MessageKey
> = {
  refund: "ask.cRefund",
  writeoff: "ask.cWriteoff",
  discount: "ask.cDiscount",
  cancel: "ask.cCancel",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-caption">
      <span className="text-ink-soft">{label}</span>
      <span className="num text-right font-medium text-ink">{children}</span>
    </div>
  );
}

function CardBody({ card }: { card: Card }) {
  const t = useT();
  switch (card.type) {
    case "payment":
      return (
        <>
          <Row label={t("ask.fFrom")}>{card.name}</Row>
          <Row label={t("ask.fAmount")}>{formatMoney(card.amount)}</Row>
          <Row label={t("ask.fAppliedTo")}>{t("ask.oldest")}</Row>
          <Row label={t("ask.fLeft")}>{formatMoney(card.left)}</Row>
        </>
      );
    case "invoice":
      return (
        <>
          <Row label={t("ask.fFor")}>{card.name ?? "–"}</Row>
          <Row label={t("ask.fAmount")}>{formatMoney(card.amount)}</Row>
          {card.what && <Row label={t("ask.fWhat")}>{card.what}</Row>}
        </>
      );
    case "customer":
      return (
        <>
          <Row label={t("ask.fName")}>{card.name}</Row>
          <Row label={t("ask.fPhone")}>{card.phone ?? "–"}</Row>
        </>
      );
    case "reminder":
      return (
        <>
          <Row label={t("ask.fFor")}>{card.name}</Row>
          <Row label={t("ask.fOverdue")}>
            {card.overdue > 0 ? formatMoney(card.overdue) : "–"}
          </Row>
          {!card.hasPhone && (
            <p className="text-caption text-overdue">
              {t("ask.noPhone", { name: card.name })}
            </p>
          )}
        </>
      );
    case "sensitive":
      return (
        <>
          {card.name && <Row label={t("ask.fFor")}>{card.name}</Row>}
          {card.amount !== undefined && (
            <Row label={t("ask.fAmount")}>{formatMoney(card.amount)}</Row>
          )}
        </>
      );
    case "list":
      return (
        <>
          <ul className="flex flex-col divide-y divide-line">
            {card.rows.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-4 py-1.5 text-caption"
              >
                <Link
                  href={`/customers/${r.id}`}
                  className="truncate text-ink hover:underline"
                >
                  {r.name}
                </Link>
                <span className="num font-medium">{formatMoney(r.amount)}</span>
              </li>
            ))}
          </ul>
          {card.more > 0 && (
            <p className="text-caption text-ink-soft">
              {t("ask.listMore", { count: card.more })}
            </p>
          )}
          <Row label={t("ask.listTotal")}>{formatMoney(card.total)}</Row>
          <Link
            href={card.href}
            className="text-caption font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("ask.listOpen")}
          </Link>
        </>
      );
  }
}

function cardTitle(card: Card): MessageKey {
  switch (card.type) {
    case "payment":
      return "ask.cPayment";
    case "invoice":
      return "ask.cInvoice";
    case "customer":
      return "ask.cCustomer";
    case "reminder":
      return "ask.cReminder";
    case "sensitive":
      return sensitiveTitle[card.action];
    case "list":
      return card.title;
  }
}

// ---- The panel ----

export function AskPanel() {
  const t = useT();
  const pathname = usePathname();
  const customers = useCustomers();
  const { remind } = useReminders();
  const { open, seed, thread } = useAsk();
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  // What the person is looking at: a customer's page names "he" and "she".
  const customerId = /^\/customers\/([^/]+)/.exec(pathname)?.[1];
  const ctxCustomer = customerId
    ? customers.find((c) => c.id === customerId)
    : undefined;

  // "/" opens the panel, unless the person is typing or a dialog is open.
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      if (
        document.querySelector("[role='dialog']:not([data-ask]), [role='menu']")
      )
        return;
      e.preventDefault();
      ask.open();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus the box when it opens; give focus back when it closes.
  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => input.current?.focus());
    } else {
      returnTo.current?.focus?.();
      returnTo.current = null;
    }
  }, [open]);

  // Keep the newest message in view
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [thread.length, open]);

  const summaryOf = (card: Card) => {
    const bits = [t(cardTitle(card))];
    if ("amount" in card && card.amount !== undefined)
      bits.push(formatMoney(card.amount));
    if ("name" in card && card.name) bits.push(card.name);
    return bits.join(" · ");
  };

  function send(raw: string) {
    const said = raw.trim();
    if (!said) return;
    ask.push({ id: newId(), role: "me", text: said });
    const reply = interpret(said, customers, { customer: ctxCustomer });
    const id = newId();
    ask.push({
      id,
      role: "bot",
      said,
      reply,
      state:
        reply.kind === "card" && reply.card.type !== "list"
          ? "pending"
          : undefined,
    });
    // Anything sensitive waits in the log until the person decides
    if (reply.kind === "card" && reply.card.type === "sensitive") {
      aiLog.add({
        id,
        said,
        summary: summaryOf(reply.card),
        status: "waiting",
        sure: reply.sure,
        card: reply.card,
      });
    }
  }

  // A seed (from the Home bar or the AI page) is sent once, when we open
  useEffect(() => {
    if (open && seed !== undefined) {
      ask.consumeSeed();
      if (seed.trim()) send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(text);
    setText("");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(text);
      setText("");
    }
  }

  function settle(
    msg: Extract<Msg, { role: "bot" }>,
    state: "done" | "cancelled",
    doneText: string,
    status: "done" | "draft" | "cancelled",
    doneHref?: string,
  ) {
    ask.update(msg.id, { state, doneText, doneHref });
    if (msg.reply.kind !== "card") return;
    const card = msg.reply.card;
    if (card.type === "sensitive") {
      aiLog.set(msg.id, { status });
    } else if (status !== "cancelled") {
      aiLog.add({
        id: msg.id,
        said: msg.said,
        summary: summaryOf(card),
        status,
        sure: msg.reply.sure,
      });
    }
  }

  function confirm(msg: Extract<Msg, { role: "bot" }>) {
    if (msg.reply.kind !== "card") return;
    const card = msg.reply.card;
    if (card.type === "customer") {
      const created = addCustomer({ name: card.name, phone: card.phone });
      toast.success(t("cust.added", { name: created.name }));
      return settle(
        msg,
        "done",
        t("ask.doneCustomer", { name: created.name }),
        "done",
        `/customers/${created.id}`,
      );
    }
    if (card.type === "reminder") {
      const c = customers.find((x) => x.id === card.customerId);
      if (c) remind(c);
      return settle(
        msg,
        "done",
        t("ask.doneReminder", { name: card.name }),
        "done",
        `/customers/${card.customerId}`,
      );
    }
    if (card.type === "payment")
      return settle(
        msg,
        "done",
        t("ask.donePayment"),
        "done",
        `/customers/${card.customerId}`,
      );
    if (card.type === "invoice")
      return settle(msg, "done", t("ask.doneInvoice"), "draft");
    return settle(msg, "done", t("ask.doneSensitive"), "done");
  }

  const cancel = (msg: Extract<Msg, { role: "bot" }>) =>
    settle(msg, "cancelled", t("ask.cancelled"), "cancelled");

  function edit(msg: Extract<Msg, { role: "bot" }>) {
    settle(msg, "cancelled", t("ask.cancelled"), "cancelled");
    setText(msg.said);
    input.current?.focus();
  }

  if (!open) return null;

  const examples: string[] = ctxCustomer
    ? [
        t("ask.exc1", { name: ctxCustomer.name }),
        t("ask.exc2", { name: ctxCustomer.name }),
        t("ask.exc3", { name: ctxCustomer.name }),
      ]
    : [t("ask.ex1"), t("ask.ex2"), t("ask.ex3"), t("ask.ex4")];

  const chips = (items: string[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => send(s)}
          className="min-h-9 rounded-control border border-line bg-surface px-3 text-left text-caption text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div
      role="dialog"
      data-ask
      aria-modal="false"
      aria-label={t("ask.title")}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          ask.close();
        }
      }}
      className="fixed z-overlay flex flex-col border-line bg-surface shadow-pop max-md:inset-x-0 max-md:bottom-0 max-md:top-16 max-md:rounded-t-card max-md:border-t md:bottom-0 md:right-0 md:top-14 md:w-[400px] md:border-l"
    >
      <div className="flex items-center gap-2 border-b border-line py-1 pl-4 pr-2">
        <Sparkles
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className="text-primary"
        />
        <h2 className="flex-1 text-body font-semibold text-ink">
          {t("ask.title")}
          <span className="ml-2 rounded-chip border border-current px-1.5 text-micro font-semibold uppercase tracking-micro text-ink-soft">
            {t("ask.preview")}
          </span>
        </h2>
        {thread.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => ask.reset()}>
            {t("ask.newChat")}
          </Button>
        )}
        <Hint label={t("ask.close")}>
          <button
            type="button"
            onClick={() => ask.close()}
            aria-label={t("ask.close")}
            className="flex size-11 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </Hint>
      </div>

      {ctxCustomer && (
        <p className="mx-4 mt-3 w-fit rounded-control bg-surface-2 px-2 py-1 text-caption text-ink-soft">
          {t("ask.context", { name: ctxCustomer.name })}
        </p>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-label={t("ask.title")}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {thread.length === 0 ? (
          <div>
            <p className="text-body font-semibold text-ink">{t("ask.empty")}</p>
            <p className="mt-0.5 text-body text-ink-soft">
              {t("ask.emptyBody")}
            </p>
            {chips(examples)}
            <p className="mt-4 text-caption text-ink-soft">
              {t("ask.previewNote")}
            </p>
          </div>
        ) : (
          thread.map((m) =>
            m.role === "me" ? (
              <p
                key={m.id}
                className="max-w-[88%] self-end rounded-card bg-primary px-3 py-2 text-body text-on-primary"
              >
                {m.text}
              </p>
            ) : (
              <BotMessage
                key={m.id}
                msg={m}
                chips={chips}
                examples={examples}
                send={send}
                onConfirm={() => confirm(m)}
                onCancel={() => cancel(m)}
                onEdit={() => edit(m)}
              />
            ),
          )
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="ask-input" className="sr-only">
          {t("ask.placeholder")}
        </label>
        <textarea
          id="ask-input"
          ref={input}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={t("ask.placeholder")}
          className="field-box min-h-11 flex-1 resize-none px-3 py-2 text-body text-ink outline-none placeholder:text-ink-faint"
        />
        <Hint label={t("ask.send")}>
          <button
            type="submit"
            aria-label={t("ask.send")}
            disabled={!text.trim()}
            className={buttonClass("primary", "icon")}
          >
            <ArrowUp size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </Hint>
      </form>
    </div>
  );
}

function BotMessage({
  msg,
  chips,
  examples,
  send,
  onConfirm,
  onCancel,
  onEdit,
}: {
  msg: Extract<Msg, { role: "bot" }>;
  chips: (items: string[]) => ReactNode;
  examples: string[];
  send: (s: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) {
  const t = useT();
  const bubble =
    "max-w-[94%] rounded-card bg-surface-2 px-3 py-2 text-body text-ink";
  const r = msg.reply;

  if (r.kind === "text")
    return (
      <div className={bubble}>
        {t(r.text.key, r.text.params)}
        {r.text.key === "ask.unknown" && chips(examples)}
      </div>
    );

  if (r.kind === "choose")
    return (
      <div className={bubble}>
        {t(r.text.key, r.text.params)}
        <div className="mt-2 flex flex-wrap gap-2">
          {r.options.map((o) => (
            <button
              key={o.say}
              type="button"
              onClick={() => send(o.say)}
              className="min-h-9 rounded-control border border-line bg-surface px-3 text-caption text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );

  const card = r.card;
  const settled = msg.state === "done" || msg.state === "cancelled";
  const sensitive = card.type === "sensitive";
  const blocked = card.type === "reminder" && !card.hasPhone;
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-body font-semibold text-ink">
          {t(cardTitle(card))}
        </h3>
        {card.type !== "list" && (
          <span className="num rounded-chip bg-surface-2 px-1.5 text-micro text-ink-soft">
            {t("ask.sure", { pct: r.sure })}
          </span>
        )}
      </div>
      <CardBody card={card} />
      {sensitive && !settled && (
        <p className="rounded-control bg-partly-bg px-2 py-1 text-caption text-partly">
          {t("ask.warn")}
        </p>
      )}
      {card.type !== "list" &&
        (settled ? (
          <p
            className={`flex items-center gap-1.5 text-caption ${
              msg.state === "done" ? "text-ink" : "text-ink-soft"
            }`}
          >
            {msg.state === "done" && (
              <Check
                size={14}
                strokeWidth={2}
                aria-hidden
                className="text-paid"
              />
            )}
            {msg.doneText}
            {msg.doneHref && (
              <Link
                href={msg.doneHref}
                className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("ask.openRecord", {
                  name: "name" in card && card.name ? card.name : "",
                }).trim()}
              </Link>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={onConfirm} disabled={blocked}>
              {t("ask.confirm")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onEdit}>
              {t("ask.edit")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {t("ask.cancel")}
            </Button>
          </div>
        ))}
    </div>
  );
}
