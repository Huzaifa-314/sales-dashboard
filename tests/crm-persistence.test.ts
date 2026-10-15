import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CrmDatabase } from "../src/lib/crm/db.ts";

test("CRM records and passwords survive a new database instance", () => {
  const dir = mkdtempSync(join(tmpdir(), "crm-persistence-"));
  const previousPath = process.env.CRM_DB_PATH;
  process.env.CRM_DB_PATH = join(dir, "crm.sqlite");
  try {
    const first = new CrmDatabase();
    const org = first.createOrganization({ name: "Persistent Workspace", slug: "persistent-workspace" });
    const user = first.createUser({ email: "persist@example.test", name: "Persist" });
    first.setPassword(user.id, "secret-value");
    first.createMembership({ organizationId: org.id, userId: user.id, role: "OWNER" });
    const lead = first.createLead({ organizationId: org.id, company: "Persistent Customer", industry: "Other SMB", dueDate: new Date("2026-10-20T10:00:00Z") });
    first.createActivity({ organizationId: org.id, leadId: lead.id, type: "Call", notes: "Follow up" });
    first.updateTarget(org.id, "daily", { prospects: 42 });
    first.createAuditLog({ organizationId: org.id, action: "LEAD_CREATED", entityType: "lead", entityId: lead.id });

    const second = new CrmDatabase();
    assert.equal(second.listOrganizations().filter((item) => item.id === org.id).length, 1);
    assert.equal(second.verifyPassword(user.id, "secret-value"), true);
    assert.equal(second.verifyPassword(user.id, "wrong-value"), false);
    assert.equal(second.getMembership(org.id, user.id)?.role, "OWNER");
    assert.equal(second.getLead(org.id, lead.id)?.company, "Persistent Customer");
    assert.equal(second.getLead(org.id, lead.id)?.dueDate?.toISOString(), "2026-10-20T10:00:00.000Z");
    assert.equal(second.listActivitiesByLead(org.id, lead.id).length, 1);
    assert.equal(second.getTarget(org.id, "daily").prospects, 42);
    assert.equal(second.listAuditLogs(org.id).length, 1);

    second.deleteLead(org.id, lead.id);
    const third = new CrmDatabase();
    assert.equal(third.getLead(org.id, lead.id), undefined);
    assert.equal(third.listActivitiesByLead(org.id, lead.id).length, 0);
  } finally {
    if (previousPath === undefined) delete process.env.CRM_DB_PATH;
    else process.env.CRM_DB_PATH = previousPath;
    rmSync(dir, { recursive: true, force: true });
  }
});
