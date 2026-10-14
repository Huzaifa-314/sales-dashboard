"use client";

import React, { useState } from "react";
import { X, Check, Zap, Sparkles, Shield, CreditCard, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CRM_PLANS, type SubscriptionTier, type PlanConfig } from "@/lib/crm/types.ts";
import { toast } from "sonner";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onPlanUpgraded?: (newTier: SubscriptionTier) => void;
  onSelectPlan?: (plan: PlanConfig) => void;
}

export function PricingModal({
  isOpen,
  onClose,
  currentTier,
  onPlanUpgraded,
  onSelectPlan,
}: PricingModalProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSelectPlan(tier: SubscriptionTier) {
    if (tier === currentTier) return;
    try {
      setLoadingTier(tier);
      const res = await fetch("/api/crm/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update subscription");
      }

      toast.success(`Upgraded to ${CRM_PLANS[tier].name}!`);
      if (onPlanUpgraded) onPlanUpgraded(tier);
      if (onSelectPlan) onSelectPlan(CRM_PLANS[tier]);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to process upgrade.");
    } finally {
      setLoadingTier(null);
    }
  }

  const plans = Object.values(CRM_PLANS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing for Growing Teams
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Scale Your Malaysian SMB Sales Engine
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Choose a plan tailored to your team size and monthly acquisition velocity.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isCurrent = p.tier === currentTier;
            const isPopular = p.tier === "GROWTH";

            return (
              <div
                key={p.tier}
                className={`flex flex-col justify-between rounded-xl border p-5 relative transition-all ${
                  isCurrent
                    ? "border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 ring-1 ring-teal-500"
                    : isPopular
                      ? "border-blue-400 bg-blue-50/10 dark:bg-blue-950/10 shadow-md"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850"
                }`}
              >
                {isPopular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                    MOST POPULAR
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-teal-600 text-white shadow-2xs">
                    ACTIVE PLAN
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                      RM {p.priceMonthlyMYR}
                    </span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>
                  {p.priceMonthlyUSD > 0 && (
                    <div className="text-[11px] text-zinc-400">
                      ~${p.priceMonthlyUSD} USD
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Includes:
                    </div>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <Button
                    onClick={() => handleSelectPlan(p.tier)}
                    disabled={isCurrent || loadingTier === p.tier}
                    variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                    className={`w-full text-xs font-semibold ${
                      isPopular && !isCurrent ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                    }`}
                  >
                    {loadingTier === p.tier
                      ? "Switching..."
                      : isCurrent
                        ? "Current Plan"
                        : p.priceMonthlyMYR === 0
                          ? "Downgrade"
                          : "Upgrade to " + p.tier}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" /> 14-day money-back guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-500" /> Supports FPX & Malaysian Cards via Stripe
          </span>
        </div>
      </div>
    </div>
  );
}
