"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, BarChart3, RefreshCw, CheckCircle2, Award, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { Card } from "@/components/app/card";
import { Button } from "@/components/ui/button";
import type { Target, Lead, Activity } from "@/lib/crm/types.ts";
import { toast } from "sonner";

export default function TargetsPage() {
  const [dailyTarget, setDailyTarget] = useState<Target | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState<Target | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, leadsRes, actRes] = await Promise.all([
        fetch("/api/crm/targets?period=daily"),
        fetch("/api/crm/targets?period=weekly"),
        fetch("/api/crm/leads"),
        fetch("/api/crm/activities"),
      ]);

      if (dailyRes.ok) {
        const d = await dailyRes.json();
        setDailyTarget(d.target || null);
      }
      if (weeklyRes.ok) {
        const w = await weeklyRes.json();
        setWeeklyTarget(w.target || null);
      }
      if (leadsRes.ok) {
        const l = await leadsRes.json();
        setLeads(l.leads || []);
      }
      if (actRes.ok) {
        const a = await actRes.json();
        setActivities(a.activities || []);
      }
    } catch (err) {
      console.error("Failed to load targets", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const wonCount = leads.filter((l) => l.stage === "Won — Paid").length;

  return (
    <AppShell>
      <PageHeader
        title="Sales Performance Targets & Quotas"
        subtitle="Real-time tracking of operational sales activity against daily and weekly revenue goals."
        actions={
          <Button asChild variant="outline">
            <Link href="/pipeline">
              <TrendingUp size={16} strokeWidth={1.5} className="text-teal-600" />
              Pipeline Board
            </Link>
          </Button>
        }
      />

      {/* KPI Band */}
      <div className="mt-4">
        <SummaryStrip
          label="Quotas"
          items={[
            {
              label: "Prospects Captured",
              value: `${leads.length} leads`,
            },
            {
              label: "Outreach Activities",
              value: `${activities.length} touches`,
            },
            {
              label: "Demos Completed",
              value: `${leads.filter((l) => l.stage.includes("Demo")).length} demos`,
            },
            {
              label: "Won Deals",
              value: `${wonCount} deals`,
            },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="t-section text-ink">Daily Quota Benchmark</h3>
              <p className="text-caption text-ink-soft">
                Expected daily volume per full-time sales rep
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-chip bg-surface-2 border border-line text-ink font-semibold text-micro uppercase">
              Daily
            </span>
          </div>

          {dailyTarget && (
            <div className="space-y-4">
              {[
                { label: "Prospects Added", target: dailyTarget.prospects, actual: leads.length },
                { label: "Outreach Calls / Messages", target: dailyTarget.outreach, actual: activities.length },
                {
                  label: "Follow-ups Completed",
                  target: dailyTarget.followups,
                  actual: activities.filter((a) => a.type === "FOLLOW_UP").length,
                },
                {
                  label: "Meetings Scheduled",
                  target: dailyTarget.meetings,
                  actual: leads.filter((l) => l.stage === "Meeting Scheduled").length,
                },
                {
                  label: "Demos Conducted",
                  target: dailyTarget.demos,
                  actual: leads.filter((l) => l.stage === "Demo Completed").length,
                },
                { label: "Deals Closed", target: dailyTarget.paid, actual: wonCount },
              ].map((item) => {
                const percent = Math.min(
                  Math.round((item.actual / (item.target || 1)) * 100),
                  100,
                );
                const isMet = item.actual >= item.target;

                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-ink font-medium">{item.label}</span>
                      <span className="num text-ink-soft">
                        <strong className="text-ink font-semibold">{item.actual}</strong> / {item.target} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isMet ? "bg-paid" : "bg-brass"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Weekly Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="t-section text-ink">Weekly Team Targets</h3>
              <p className="text-caption text-ink-soft">
                Aggregate weekly milestone for the acquisition pod
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-chip bg-surface-2 border border-line text-ink font-semibold text-micro uppercase">
              Weekly
            </span>
          </div>

          {weeklyTarget && (
            <div className="space-y-4">
              {[
                { label: "Prospects Added", target: weeklyTarget.prospects, actual: leads.length },
                { label: "Outreach Calls / Messages", target: weeklyTarget.outreach, actual: activities.length },
                {
                  label: "Follow-ups Completed",
                  target: weeklyTarget.followups,
                  actual: activities.filter((a) => a.type === "FOLLOW_UP").length,
                },
                {
                  label: "Meetings Scheduled",
                  target: weeklyTarget.meetings,
                  actual: leads.filter((l) => l.stage === "Meeting Scheduled").length,
                },
                {
                  label: "Demos Conducted",
                  target: weeklyTarget.demos,
                  actual: leads.filter((l) => l.stage === "Demo Completed").length,
                },
                { label: "Deals Closed", target: weeklyTarget.paid, actual: wonCount },
              ].map((item) => {
                const percent = Math.min(
                  Math.round((item.actual / (item.target || 1)) * 100),
                  100,
                );
                const isMet = item.actual >= item.target;

                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-ink font-medium">{item.label}</span>
                      <span className="num text-ink-soft">
                        <strong className="text-ink font-semibold">{item.actual}</strong> / {item.target} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isMet ? "bg-paid" : "bg-brass"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
