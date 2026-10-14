#!/usr/bin/env node
import { importSingleFileBackup } from "../src/lib/crm/migrate-local-backup.ts";

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const organizationId = args[1] || "org_default_sales";
  const userId = args[2] || "usr_sales_owner";

  if (!filePath) {
    console.error("Usage: node --experimental-strip-types scripts/migrate-local-backup.ts <backup.json> [organizationId] [userId]");
    process.exit(1);
  }

  console.log(`Starting migration from ${filePath} into organization ${organizationId}...`);
  try {
    const result = await importSingleFileBackup(filePath, organizationId, userId);
    console.log(`Migration completed successfully!`);
    console.log(`- Leads imported: ${result.importedLeads}`);
    console.log(`- Activities imported: ${result.importedActivities}`);
  } catch (err: any) {
    console.error(`Migration failed:`, err.message);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("migrate-local-backup.ts")) {
  main();
}
