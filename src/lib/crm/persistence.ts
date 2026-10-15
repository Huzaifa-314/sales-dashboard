import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type RecordKind =
  | "organizations"
  | "users"
  | "memberships"
  | "leads"
  | "activities"
  | "targets"
  | "subscriptions"
  | "apiKeys"
  | "auditLogs"
  | "passwords";

const DATE_FIELDS: Partial<Record<RecordKind, string[]>> = {
  organizations: ["createdAt", "updatedAt"],
  users: ["createdAt", "updatedAt"],
  memberships: ["createdAt"],
  leads: ["lastContact", "dueDate", "closeDate", "wonDate", "createdAt", "updatedAt"],
  activities: ["createdAt"],
  targets: ["updatedAt"],
  subscriptions: ["currentPeriodEnd", "createdAt", "updatedAt"],
  apiKeys: ["lastUsedAt", "createdAt"],
  auditLogs: ["createdAt"],
};

function revive(kind: RecordKind, payload: string): unknown {
  const value = JSON.parse(payload);
  for (const field of DATE_FIELDS[kind] ?? []) {
    if (typeof value[field] === "string") value[field] = new Date(value[field]);
  }
  return value;
}

export class CrmPersistence {
  private readonly database: Database.Database;
  private readonly putStatement: Database.Statement;
  private readonly deleteStatement: Database.Statement;

  constructor(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.database = new Database(filePath);
    this.database.pragma("journal_mode = WAL");
    this.database.pragma("synchronous = FULL");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS crm_records (
        kind TEXT NOT NULL,
        record_key TEXT NOT NULL,
        organization_id TEXT,
        payload TEXT NOT NULL,
        PRIMARY KEY (kind, record_key)
      );
      CREATE INDEX IF NOT EXISTS crm_records_org_idx
        ON crm_records (kind, organization_id);
    `);
    const check = this.database.pragma("integrity_check", { simple: true });
    if (check !== "ok") throw new Error("CRM database integrity check failed");
    this.putStatement = this.database.prepare(`
      INSERT INTO crm_records (kind, record_key, organization_id, payload)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (kind, record_key) DO UPDATE SET
        organization_id = excluded.organization_id,
        payload = excluded.payload
    `);
    this.deleteStatement = this.database.prepare(
      "DELETE FROM crm_records WHERE kind = ? AND record_key = ?",
    );
  }

  hasData(): boolean {
    return Boolean(this.database.prepare("SELECT 1 FROM crm_records LIMIT 1").get());
  }

  load<T>(kind: RecordKind): Map<string, T> {
    const rows = this.database.prepare(
      "SELECT record_key, payload FROM crm_records WHERE kind = ?",
    ).all(kind) as { record_key: string; payload: string }[];
    return new Map(rows.map((row) => [row.record_key, revive(kind, row.payload) as T]));
  }

  put(kind: RecordKind, key: string, value: unknown): void {
    const organizationId = typeof value === "object" && value !== null && "organizationId" in value
      ? String(value.organizationId)
      : null;
    this.putStatement.run(kind, key, organizationId, JSON.stringify(value));
  }

  delete(kind: RecordKind, key: string): void {
    this.deleteStatement.run(kind, key);
  }

  clear(): void {
    this.database.exec("DELETE FROM crm_records");
  }

  transaction<T>(operation: () => T): T {
    return this.database.transaction(operation)();
  }
}
