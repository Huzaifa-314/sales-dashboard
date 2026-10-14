import type { MessageKey } from "@/i18n/messages";
import type { Customer } from "@/lib/customers";

// A stand-in for the AI service, so the screens can be built and tested before
// the service exists. It understands a few phrases with plain rules and
// returns the same shapes the real service will: a plain answer, a question
// with choices, or an action card to confirm. Swap `interpret` for a call to
// the service later; nothing else changes.

export type Tx = { key: MessageKey; params?: Record<string, string | number> };

export type Card =
  | {
      type: "payment";
      customerId: string;
      name: string;
      amount: number;
      left: number;
    }
  | {
      type: "invoice";
      customerId?: string;
      name?: string;
      amount: number;
      what?: string;
    }
  | { type: "customer"; name: string; phone?: string }
  | {
      type: "reminder";
      customerId: string;
      name: string;
      overdue: number;
      hasPhone: boolean;
    }
  | {
      type: "sensitive";
      action: "refund" | "writeoff" | "discount" | "cancel";
      customerId?: string;
      name?: string;
      amount?: number;
    }
  | {
      type: "list";
      title: MessageKey;
      rows: { id: string; name: string; amount: number }[];
      more: number;
      total: number;
      href: string;
    };

export type Reply =
  | { kind: "text"; text: Tx }
  | { kind: "choose"; text: Tx; options: { label: string; say: string }[] }
  | { kind: "card"; card: Card; sure: number };

// What the person is looking at, so "he paid 500" knows who "he" is.
export type AskContext = { customer?: Customer };

const has = (text: string, words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`, "i").test(text));

// "RM500", "rm 1,200.50", "5k", "500"
function findAmount(text: string): number | undefined {
  const m = /(?:rm\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/i.exec(text);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? (m[2] ? n * 1000 : n) : undefined;
}

type Found =
  | { kind: "one"; customer: Customer; sure: number }
  | { kind: "many"; token: string; matches: Customer[] }
  | { kind: "none" };

function findCustomer(
  text: string,
  customers: Customer[],
  ctx: AskContext,
): Found {
  const lower = text.toLowerCase();
  const full = customers.filter((c) => lower.includes(c.name.toLowerCase()));
  if (full.length === 1) return { kind: "one", customer: full[0], sure: 96 };
  if (full.length > 1) {
    const longest = [...full].sort((a, b) => b.name.length - a.name.length)[0];
    return { kind: "one", customer: longest, sure: 92 };
  }
  const words = new Set(lower.match(/[a-z']{3,}/g) ?? []);
  const byToken = new Map<string, Customer[]>();
  for (const c of customers) {
    const tokens = [
      ...c.name.toLowerCase().split(/\s+/),
      ...(c.company ? c.company.toLowerCase().split(/\s+/) : []),
    ].filter((w) => w.length >= 3);
    for (const token of tokens) {
      if (!words.has(token)) continue;
      byToken.set(token, [...(byToken.get(token) ?? []), c]);
    }
  }
  const hits = [...new Set([...byToken.values()].flat())];
  if (hits.length === 1) return { kind: "one", customer: hits[0], sure: 90 };
  if (hits.length > 1) {
    const token = [...byToken.keys()][0];
    return { kind: "many", token, matches: hits.slice(0, 5) };
  }
  if (ctx.customer) return { kind: "one", customer: ctx.customer, sure: 94 };
  return { kind: "none" };
}

const top = (cs: Customer[], by: (c: Customer) => number, n = 5) =>
  [...cs].sort((a, b) => by(b) - by(a)).slice(0, n);

export function interpret(
  text: string,
  customers: Customer[],
  ctx: AskContext = {},
): Reply {
  const said = text.trim();

  // Sensitive: always an action card that waits for the person
  const sensitive: [string[], "refund" | "writeoff" | "discount" | "cancel"][] =
    [
      [["refund", "bayar balik"], "refund"],
      [["write.?off", "bad debt", "hapus kira"], "writeoff"],
      [["discount", "diskaun", "potongan"], "discount"],
      [["cancel", "batal"], "cancel"],
    ];
  for (const [words, action] of sensitive) {
    if (has(said, words)) {
      const f = findCustomer(said, customers, ctx);
      if (f.kind === "many") break;
      return {
        kind: "card",
        sure: f.kind === "one" ? Math.min(f.sure, 88) : 70,
        card: {
          type: "sensitive",
          action,
          customerId: f.kind === "one" ? f.customer.id : undefined,
          name: f.kind === "one" ? f.customer.name : undefined,
          amount: findAmount(said),
        },
      };
    }
  }

  // New customer
  if (
    has(said, ["create", "add", "new", "tambah", "baharu"]) &&
    has(said, ["customer", "pelanggan"])
  ) {
    const rest = said
      .replace(/.*?\b(customer|pelanggan)\b/i, "")
      .replace(/\+?\d[\d\s-]{7,}/g, "")
      .replace(/\b(called|named|bernama|nama)\b/gi, "")
      .trim();
    if (!rest) return { kind: "text", text: { key: "ask.needCustName" } };
    const phone = /\+?\d[\d\s-]{8,}/.exec(said)?.[0].trim();
    return {
      kind: "card",
      sure: 97,
      card: { type: "customer", name: rest.replace(/\s+/g, " "), phone },
    };
  }

  // Reminder
  if (has(said, ["remind", "chase", "ingatkan", "reminder"])) {
    const f = findCustomer(said, customers, ctx);
    if (f.kind === "many") return choose(said, f);
    if (f.kind === "none")
      return { kind: "text", text: { key: "ask.needName" } };
    return {
      kind: "card",
      sure: f.sure,
      card: {
        type: "reminder",
        customerId: f.customer.id,
        name: f.customer.name,
        overdue: f.customer.overdue,
        hasPhone: !!f.customer.phone,
      },
    };
  }

  // Payment received
  if (has(said, ["paid", "received", "payment", "bayar", "terima"])) {
    const f = findCustomer(said, customers, ctx);
    if (f.kind === "many") return choose(said, f);
    if (f.kind === "none")
      return { kind: "text", text: { key: "ask.needName" } };
    const amount = findAmount(said);
    if (amount === undefined)
      return { kind: "text", text: { key: "ask.needAmount" } };
    return {
      kind: "card",
      sure: f.sure,
      card: {
        type: "payment",
        customerId: f.customer.id,
        name: f.customer.name,
        amount,
        left: Math.max(0, f.customer.outstanding - amount),
      },
    };
  }

  // Draft invoice
  if (has(said, ["invoice", "invois", "bill"])) {
    const f = findCustomer(said, customers, ctx);
    if (f.kind === "many") return choose(said, f);
    const amount = findAmount(said);
    if (amount === undefined)
      return { kind: "text", text: { key: "ask.needAmount" } };
    const what = /\bfor\s+(.+?)(?:\s+(?:rm|\d)|$)/i.exec(said)?.[1];
    return {
      kind: "card",
      sure: f.kind === "one" ? f.sure - 4 : 74,
      card: {
        type: "invoice",
        customerId: f.kind === "one" ? f.customer.id : undefined,
        name: f.kind === "one" ? f.customer.name : undefined,
        amount,
        what: what && !/^\d/.test(what) ? what : undefined,
      },
    };
  }

  // Money collected
  if (has(said, ["collect", "kutip"])) {
    return { kind: "text", text: { key: "ask.collected" } };
  }

  // Who owes
  if (
    has(said, [
      "owe",
      "owes",
      "berhutang",
      "outstanding",
      "overdue",
      "late",
      "lewat",
      "who",
    ])
  ) {
    const overdue = has(said, ["overdue", "late", "lewat"]);
    const min = /(?:more than|over|above|lebih)\s*(?:rm\s*)?(\d[\d,]*)/i.exec(
      said,
    );
    const threshold = min ? Number(min[1].replace(/,/g, "")) : 0;
    const value = (c: Customer) => (overdue ? c.overdue : c.outstanding);
    const matches = customers.filter((c) => value(c) > threshold);
    if (matches.length === 0)
      return { kind: "text", text: { key: "ask.listNone" } };
    const shown = top(matches, value);
    return {
      kind: "card",
      sure: 99,
      card: {
        type: "list",
        title: overdue ? "ask.listOverdue" : "ask.listOwing",
        rows: shown.map((c) => ({ id: c.id, name: c.name, amount: value(c) })),
        more: matches.length - shown.length,
        total: matches.reduce((s, c) => s + value(c), 0),
        href: overdue ? "/customers?filter=overdue" : "/customers?filter=owing",
      },
    };
  }

  return { kind: "text", text: { key: "ask.unknown" } };
}

function choose(said: string, f: Extract<Found, { kind: "many" }>): Reply {
  return {
    kind: "choose",
    text: { key: "ask.whichOne", params: { name: f.token } },
    options: f.matches.map((c) => ({
      label: c.company ? `${c.name} · ${c.company}` : c.name,
      say: said.replace(new RegExp(`\\b${f.token}\\b`, "i"), c.name),
    })),
  };
}
