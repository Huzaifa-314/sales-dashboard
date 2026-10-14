"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Shield, RefreshCw, MessageSquare, Phone, Calendar, ArrowRight, User } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Card } from "@/components/app/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { StatusLabel } from "@/components/app/status-label";
import { Button } from "@/components/ui/button";
import type { Activity, AuditLog, Lead } from "@/lib/crm/types.ts";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<"outreach" | "security">("outreach");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [actRes, auditRes, leadsRes] = await Promise.all([
        fetch("/api/crm/activities"),
        fetch("/api/crm/audit-logs"),
        fetch("/api/crm/leads"),
      ]);

      if (actRes.ok) {
        const a = await actRes.json();
        setActivities(a.activities || []);
      }
      if (auditRes.ok) {
        const aud = await auditRes.json();
        setAuditLogs(aud.auditLogs || []);
      }
      if (leadsRes.ok) {
        const l = await leadsRes.json();
        setLeads(l.leads || []);
      }
    } catch (err) {
      console.error("Failed to load activity stream", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Outreach History & Security Audits"
        subtitle="Complete chronological audit trail of all outreach touches, pipeline shifts, and enterprise security events."
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-control border border-line bg-surface">
            <button
              type="button"
              onClick={() => setActiveTab("outreach")}
              className={`px-3 py-1.5 rounded-control text-caption font-semibold transition-all cursor-pointer ${
                activeTab === "outreach"
                  ? "bg-surface-2 text-ink shadow-2xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Outreach Log ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-3 py-1.5 rounded-control text-caption font-semibold transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-surface-2 text-ink shadow-2xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Security Audits ({auditLogs.length})
            </button>
          </div>
        }
      />

      <div className="mt-4">
        <SummaryStrip
          label="Activities"
          items={[
            {
              label: "Logged Outreach Touches",
              value: `${activities.length} entries`,
            },
            {
              label: "WhatsApp Messages",
              value: `${activities.filter((a) => a.type === "WHATSAPP").length} sent`,
            },
            {
              label: "Calls & Demos",
              value: `${activities.filter((a) => a.type === "CALL" || a.type === "DEMO").length} completed`,
            },
            {
              label: "Security Audit Records",
              value: `${auditLogs.length} events`,
            },
          ]}
        />
      </div>

      <div className="mt-6">
        {activeTab === "outreach" ? (
          <Card className="p-5">
            <div className="pb-3 border-b border-line flex items-center justify-between">
              <h3 className="t-section text-ink">Recent Sales Outreach</h3>
              <span className="text-caption text-ink-soft">Chronological feed</span>
            </div>
            <div className="divide-y divide-line">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-caption text-ink-soft">
                  No outreach activities logged yet.
                </div>
              ) : (
                activities.map((act) => {
                  const lead = leads.find((l) => l.id === act.leadId);
                  return (
                    <div
                      key={act.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={lead?.company || act.type} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-body text-ink">
                              {lead ? lead.company : "Unassigned Lead"}
                            </span>
                            <StatusLabel tone="owing" label={act.type} />
                          </div>
                          {act.notes && (
                            <p className="mt-1 text-caption text-ink-soft">
                              {act.notes}
                            </p>
                          )}
                          {act.nextAction && (
                            <p className="mt-0.5 text-caption text-brass font-medium">
                              Next: {act.nextAction}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <span className="num text-caption text-ink-faint">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="pb-3 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-teal-600" />
                <h3 className="t-section text-ink">Enterprise Audit Log</h3>
              </div>
              <span className="text-micro px-2 py-0.5 rounded-chip bg-surface-2 border border-line text-ink-soft uppercase font-semibold">
                Append-only
              </span>
            </div>

            <div className="divide-y divide-line">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-caption text-ink-soft">
                  No audit events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusLabel
                          tone={
                            log.action.includes("CREATE")
                              ? "paid"
                              : log.action.includes("DELETE")
                                ? "overdue"
                                : "settled"
                          }
                          label={log.action}
                        />
                        <span className="font-medium text-body text-ink">
                          {log.entityType} ({log.entityId || "N/A"})
                        </span>
                      </div>
                      <p className="mt-1 num text-caption text-ink-soft">
                        Actor: {log.userId || "system"} · Action: {log.action}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="num text-caption text-ink-faint">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
