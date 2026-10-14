"use client";

import { useSyncExternalStore } from "react";
import type { Card, Reply } from "@/lib/ai-mock";

// State for the Ask panel and the AI page. The open/closed state and the
// conversation live in memory (they are for this visit); the log of what the AI
// did is kept in localStorage so the AI page can show it later.

export type Msg =
  | { id: string; role: "me"; text: string }
  | {
      id: string;
      role: "bot";
      reply: Reply;
      said: string;
      // For cards: waiting for the person, or settled
      state?: "pending" | "done" | "cancelled";
      doneText?: string;
      doneHref?: string;
    };

type PanelState = { open: boolean; seed?: string; thread: Msg[] };

let panel: PanelState = { open: false, thread: [] };
const panelListeners = new Set<() => void>();

function setPanel(next: PanelState) {
  panel = next;
  panelListeners.forEach((l) => l());
}

const subscribePanel = (cb: () => void) => {
  panelListeners.add(cb);
  return () => void panelListeners.delete(cb);
};

export const ask = {
  open(seed?: string) {
    setPanel({ ...panel, open: true, seed });
  },
  close() {
    setPanel({ ...panel, open: false, seed: undefined });
  },
  toggle() {
    setPanel({ ...panel, open: !panel.open, seed: undefined });
  },
  consumeSeed() {
    if (panel.seed !== undefined) setPanel({ ...panel, seed: undefined });
  },
  push(msg: Msg) {
    setPanel({ ...panel, thread: [...panel.thread, msg] });
  },
  update(id: string, patch: Partial<Extract<Msg, { role: "bot" }>>) {
    setPanel({
      ...panel,
      thread: panel.thread.map((m) =>
        m.id === id && m.role === "bot" ? { ...m, ...patch } : m,
      ),
    });
  },
  reset() {
    setPanel({ ...panel, thread: [] });
  },
};

export function useAsk() {
  return useSyncExternalStore(
    subscribePanel,
    () => panel,
    () => panel,
  );
}

export const newId = () => Math.random().toString(36).slice(2, 10);

// ---- The log: what the AI did, kept for the AI page ----

export type LogEntry = {
  id: string;
  at: number;
  said: string;
  // What it understood, in words ("Record payment · RM 500.00 · Ahmad")
  summary: string;
  status: "done" | "draft" | "waiting" | "cancelled";
  sure: number;
  // Kept for entries that wait, so "Review" can bring the card back
  card?: Card;
};

const LOG_KEY = "invoispro:ai-log";
const logListeners = new Set<() => void>();

function readLog(): string {
  try {
    return localStorage.getItem(LOG_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeLog(entries: LogEntry[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {}
  logListeners.forEach((l) => l());
}

const parse = (raw: string): LogEntry[] => {
  try {
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
};

export const aiLog = {
  add(entry: Omit<LogEntry, "at">) {
    writeLog([{ ...entry, at: Date.now() }, ...parse(readLog())]);
  },
  set(id: string, patch: Partial<LogEntry>) {
    writeLog(
      parse(readLog()).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  },
};

// A stable snapshot: the raw string, parsed by the caller's memo
export function useAiLogRaw() {
  return useSyncExternalStore(
    (cb) => {
      logListeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        logListeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    readLog,
    () => "",
  );
}

export const parseLog = parse;

// ---- Rules: what the AI may do on its own (a setting for later) ----

const RULE_KEY = "invoispro:ai-simple-payments";
export type PaymentRule = "ask" | "do";
const ruleListeners = new Set<() => void>();

export function usePaymentRule(): [PaymentRule, (v: PaymentRule) => void] {
  const raw = useSyncExternalStore(
    (cb) => {
      ruleListeners.add(cb);
      return () => void ruleListeners.delete(cb);
    },
    () => {
      try {
        return localStorage.getItem(RULE_KEY) ?? "ask";
      } catch {
        return "ask";
      }
    },
    () => "ask",
  );
  return [
    raw === "do" ? "do" : "ask",
    (v) => {
      try {
        localStorage.setItem(RULE_KEY, v);
      } catch {}
      ruleListeners.forEach((l) => l());
    },
  ];
}

// "Review" on the AI page: bring a waiting card back into the panel, with the
// same id, so confirming it settles that log entry.
export function reviewEntry(entry: LogEntry) {
  if (!entry.card) return ask.open();
  const exists = panel.thread.some((m) => m.id === entry.id);
  if (!exists) {
    ask.push({ id: newId(), role: "me", text: entry.said });
    ask.push({
      id: entry.id,
      role: "bot",
      said: entry.said,
      reply: { kind: "card", card: entry.card, sure: entry.sure },
      state: "pending",
    });
  }
  ask.open();
}
