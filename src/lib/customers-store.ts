"use client";

import { useSyncExternalStore } from "react";
import { sampleCustomers, type Customer } from "@/lib/customers";

// Customers added or edited in this browser, kept in localStorage until the
// customers API exists. The list is the sample data plus what was added, with
// edits laid over both. Storage can be unavailable (private window), so every
// access is guarded.
const ADDED = "invoispro:customers:added";
const EDITS = "invoispro:customers:edits";
const listeners = new Set<() => void>();

let cachedKey: string | undefined;
let cached: Customer[] = sampleCustomers;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// useSyncExternalStore needs the same array back while nothing has changed.
function snapshot(): Customer[] {
  const a = read(ADDED);
  const e = read(EDITS);
  const key = `${a}|${e}`;
  if (key === cachedKey) return cached;
  cachedKey = key;
  const added = parse<Customer[]>(a, []);
  const edits = parse<Record<string, Partial<Customer>>>(e, {});
  cached = [...sampleCustomers, ...added].map((c) =>
    edits[c.id] ? { ...c, ...fromStored(edits[c.id]) } : c,
  );
  return cached;
}

// JSON drops `undefined`, which would quietly bring back a value the person
// cleared. Edits are stored with null for "cleared" and turned back on reading.
const toStored = (f: Partial<Customer>) =>
  Object.fromEntries(
    Object.entries(f).map(([k, v]) => [k, v === undefined ? null : v]),
  ) as Partial<Customer>;
const fromStored = (f: Partial<Customer>) =>
  Object.fromEntries(
    Object.entries(f).map(([k, v]) => [k, v === null ? undefined : v]),
  ) as Partial<Customer>;

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCustomers() {
  return useSyncExternalStore(subscribe, snapshot, () => sampleCustomers);
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}

// The fields the person can set. The money figures belong to invoices and
// payments, so a new customer starts at zero.
export type CustomerInput = Partial<
  Omit<
    Customer,
    | "id"
    | "outstanding"
    | "overdue"
    | "credit"
    | "openInvoices"
    | "lastActivity"
    | "overdueDays"
    | "lastPayment"
  >
> & { name: string };

export function addCustomer(input: CustomerInput): Customer {
  const customer: Customer = {
    ...input,
    id: `n${Date.now().toString(36)}`,
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    outstanding: 0,
    overdue: 0,
    credit: 0,
    openInvoices: 0,
    lastActivity: new Date().toISOString().slice(0, 10),
  };
  write(ADDED, [...parse<Customer[]>(read(ADDED), []), customer]);
  return customer;
}

// Changes a customer. A sample customer keeps its original and gets an edit laid
// over it, so the sample data itself never changes.
export function updateCustomer(id: string, fields: Partial<Customer>) {
  const added = parse<Customer[]>(read(ADDED), []);
  if (added.some((c) => c.id === id)) {
    write(
      ADDED,
      added.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    );
    return;
  }
  const edits = parse<Record<string, Partial<Customer>>>(read(EDITS), {});
  write(EDITS, { ...edits, [id]: { ...edits[id], ...toStored(fields) } });
}
