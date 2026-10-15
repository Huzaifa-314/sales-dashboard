#!/usr/bin/env node
import Database from "better-sqlite3";

const source = process.env.CRM_DB_PATH;
const destination = process.argv[2];
if (!source || !destination) {
  console.error("Usage: CRM_DB_PATH=<database> node scripts/backup-crm.mjs <destination>");
  process.exit(1);
}

const database = new Database(source, { readonly: true, fileMustExist: true });
try {
  await database.backup(destination);
} finally {
  database.close();
}
