"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  CreditCard,
  Users,
  Key,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/app/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { StatusLabel } from "@/components/app/status-label";
import { PricingModal } from "@/components/billing/pricing-modal.tsx";
import { TeamModal } from "@/components/team/team-modal.tsx";
import { Button } from "@/components/ui/button";
import type { SubscriptionTier } from "@/lib/crm/types.ts";
import { toast } from "sonner";

export default function SettingsPage() {
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("FREE");
  const [leadQuotaLimit, setLeadQuotaLimit] = useState(50);
  const [userQuotaLimit, setUserQuotaLimit] = useState(1);
  const [leadCount, setLeadCount] = useState(0);
  const [memberCount, setMemberCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Modals
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const defaultApiKey = "sk_live_test_webhook_secret_key_123";

  async function loadSettings() {
    try {
      setLoading(true);
      const [billingRes, leadsRes, teamRes] = await Promise.all([
        fetch("/api/crm/billing"),
        fetch("/api/crm/leads"),
        fetch("/api/crm/team"),
      ]);

      if (billingRes.ok) {
        const b = await billingRes.json();
        if (b.subscription) {
          setSubscriptionTier(b.subscription.tier || "FREE");
          setLeadQuotaLimit(b.subscription.leadQuotaLimit || 50);
          setUserQuotaLimit(b.subscription.userQuotaLimit || 1);
        }
      }
      if (leadsRes.ok) {
        const l = await leadsRes.json();
        setLeadCount(l.total || l.leads?.length || 0);
      }
      if (teamRes.ok) {
        const t = await teamRes.json();
        setMemberCount(t.total || 1);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleDownloadBackup() {
    try {
      const res = await fetch("/api/crm/backup");
      if (!res.ok) throw new Error("Failed to export backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CRM backup downloaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download backup.");
    }
  }

  async function handleRestoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/crm/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to restore backup");
      }

      toast.success("Backup imported successfully!");
      loadSettings();
    } catch (err: any) {
      toast.error(err.message || "Invalid backup JSON file.");
    } finally {
      e.target.value = "";
    }
  }

  const quotaPercent = Math.min(
    Math.round((leadCount / (leadQuotaLimit || 1)) * 100),
    100,
  );

  return (
    <AppShell>
      <PageHeader
        title="Workspace Settings"
        subtitle="Configure organization limits, subscription quotas, developer webhooks, and team access."
      />

      <div className="mt-4">
        <SummaryStrip
          label="Workspace"
          items={[
            {
              label: "Subscription Plan",
              value: subscriptionTier,
            },
            {
              label: "Lead Capacity",
              value: `${leadCount} / ${leadQuotaLimit}`,
              danger: leadCount >= leadQuotaLimit * 0.9,
            },
            {
              label: "Team Seats",
              value: `${memberCount} / ${userQuotaLimit} users`,
            },
            {
              label: "Security Isolation",
              value: "Tenant Scoped",
            },
          ]}
        />
      </div>

      <div className="mt-6 space-y-6">
        {/* CARD 1: SUBSCRIPTION & PLAN */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-control bg-surface-2 border border-line text-brass">
                <CreditCard size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="t-section text-ink">Subscription & Quota Limits</h3>
                  <StatusLabel
                    tone={subscriptionTier === "ENTERPRISE" ? "paid" : "owing"}
                    label={subscriptionTier}
                  />
                </div>
                <p className="text-caption text-ink-soft mt-0.5">
                  Plan-based caps on inbound lead acquisition and team seats
                </p>
              </div>
            </div>

            <Button onClick={() => setIsPricingModalOpen(true)}>
              Change Plan / Upgrade
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-control border border-line bg-surface-2 space-y-2">
              <div className="flex items-center justify-between text-caption">
                <span className="text-ink font-medium">Lead Storage Quota</span>
                <span className="num font-semibold text-ink">
                  {leadCount} / {leadQuotaLimit} ({quotaPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    quotaPercent >= 90
                      ? "bg-overdue"
                      : quotaPercent >= 70
                        ? "bg-partly"
                        : "bg-brass"
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-control border border-line bg-surface-2 space-y-2">
              <div className="flex items-center justify-between text-caption">
                <span className="text-ink font-medium">Team Member Seats</span>
                <span className="num font-semibold text-ink">
                  {memberCount} / {userQuotaLimit} users
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full bg-brass transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      Math.round((memberCount / (userQuotaLimit || 1)) * 100),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 2: TEAM MANAGEMENT */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-control bg-surface-2 border border-line text-teal-600">
                <Users size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="t-section text-ink">Team & Role-Based Access Control</h3>
                <p className="text-caption text-ink-soft mt-0.5">
                  Manage invited reps, assign ADMIN vs SALES_REP vs VIEWER roles
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => setIsTeamModalOpen(true)}>
              Manage Team Members ({memberCount})
            </Button>
          </div>
        </Card>

        {/* CARD 3: INBOUND WEBHOOK & API KEY */}
        <Card className="p-6">
          <div className="pb-4 border-b border-line flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-surface-2 border border-line text-brass">
              <Key size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="t-section text-ink">Inbound Lead Capture Webhook</h3>
              <p className="text-caption text-ink-soft mt-0.5">
                Automatically pipe leads into Sales CRM from Meta Ads, Google Forms, or WordPress
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-caption font-medium text-ink block mb-1.5">
                Workspace Webhook API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={defaultApiKey}
                  className="num text-caption font-mono px-3 py-2 rounded-control bg-field border border-field-border text-ink flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(defaultApiKey);
                    setCopiedKey(true);
                    toast.success("Webhook API key copied to clipboard.");
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="gap-1.5"
                >
                  {copiedKey ? <Check size={14} className="text-paid" /> : <Copy size={14} />}
                  {copiedKey ? "Copied" : "Copy Key"}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-caption font-medium text-ink block mb-1.5">
                Webhook Ingestion Endpoint
              </label>
              <div className="p-3 rounded-control bg-surface-2 border border-line font-mono text-micro text-ink-soft break-all select-all">
                POST http://localhost:3000/api/v1/leads/capture
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 4: DATA EXPORT & BACKUP */}
        <Card className="p-6">
          <div className="pb-4 border-b border-line flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-control bg-surface-2 border border-line text-ink-soft">
                <Download size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="t-section text-ink">JSON Data Export & Disaster Recovery</h3>
                <p className="text-caption text-ink-soft mt-0.5">
                  Export full workspace snapshot or restore CRM state from backup
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownloadBackup} className="gap-1.5">
                <Download size={14} strokeWidth={1.5} />
                Export Backup
              </Button>

              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-line bg-surface hover:bg-surface-2 text-caption font-medium text-ink transition-colors">
                  <Upload size={14} strokeWidth={1.5} />
                  Import Backup
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentTier={subscriptionTier}
        onSelectPlan={(plan: any) => {
          setSubscriptionTier(plan.tier);
          setLeadQuotaLimit(plan.leadQuotaLimit);
          setUserQuotaLimit(plan.userQuotaLimit);
          toast.success(`Switched plan to ${plan.tier}`);
        }}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onOpenPricing={() => {
          setIsTeamModalOpen(false);
          setIsPricingModalOpen(true);
        }}
        currentTier={subscriptionTier}
        userQuotaLimit={userQuotaLimit}
      />
    </AppShell>
  );
}
