#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

const [sourcePath, databasePath] = process.argv.slice(2);
if (!sourcePath || !databasePath) {
  console.error("Usage: node scripts/import-crm-snapshot.mjs <snapshot.json> <new.sqlite>");
  process.exit(1);
}
if (existsSync(databasePath)) throw new Error("Destination database already exists");

const names = [
  "organizations", "users", "memberships", "leads", "activities",
  "targets", "subscriptions", "apiKeys", "auditLogs", "passwords",
];
const snapshot = JSON.parse(readFileSync(sourcePath, "utf8"));
for (const name of names) {
  if (!Array.isArray(snapshot[name])) throw new Error(`Missing ${name} records`);
  for (const row of snapshot[name]) {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== "string") {
      throw new Error(`Invalid ${name} record`);
    }
  }
}

const database = new Database(databasePath, { fileMustExist: false });
try {
  database.exec(`
    CREATE TABLE crm_records (
      kind TEXT NOT NULL,
      record_key TEXT NOT NULL,
      organization_id TEXT,
      payload TEXT NOT NULL,
      PRIMARY KEY (kind, record_key)
    );
    CREATE INDEX crm_records_org_idx ON crm_records (kind, organization_id);
  `);
  const insert = database.prepare(
    "INSERT INTO crm_records (kind, record_key, organization_id, payload) VALUES (?, ?, ?, ?)",
  );
  database.transaction(() => {
    for (const name of names) {
      for (const [key, value] of snapshot[name]) {
        const organizationId = value && typeof value === "object" && "organizationId" in value
          ? String(value.organizationId)
          : null;
        insert.run(name, key, organizationId, JSON.stringify(value));
      }
    }
  })();
  if (database.pragma("integrity_check", { simple: true }) !== "ok") {
    throw new Error("Imported database failed integrity check");
  }
  console.log(Object.fromEntries(names.map((name) => [name, snapshot[name].length])));
} finally {
  database.close();
}
