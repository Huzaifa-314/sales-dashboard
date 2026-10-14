"use client";

import React, { useState } from "react";
import { X, CheckCircle, MessageSquare, Phone, Users, Monitor, Send, CreditCard, FileText } from "lucide-react";
import { CRM_ACTIVITY_TYPES, type Lead } from "@/lib/crm/types.ts";

interface QuickActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (activityData: any) => Promise<void>;
  onSaveActivity?: (activityData: any) => Promise<void>;
  lead: Lead | null;
}

export function QuickActivityModal({
  isOpen,
  onClose,
  onSave,
  onSaveActivity,
  lead,
}: QuickActivityModalProps) {
  const [type, setType] = useState<string>("Phone Call");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please describe the outcome or notes of this interaction.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const saveFn = onSave ?? onSaveActivity;
      if (saveFn) {
        await saveFn({
          leadId: lead!.id,
          type,
          notes: notes.trim(),
          nextAction: nextAction.trim() || undefined,
        });
      }
      setNotes("");
      setNextAction("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log activity");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getActivityIcon = (t: string) => {
    switch (t) {
      case "Phone Call":
        return <Phone className="w-4 h-4 text-blue-500" />;
      case "WhatsApp Chat":
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case "Meeting":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "Product Demo":
        return <Monitor className="w-4 h-4 text-amber-500" />;
      case "Offer Sent":
        return <Send className="w-4 h-4 text-indigo-500" />;
      case "Payment Received":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Log Outreach & Activity
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              For: <span className="font-medium text-teal-600 dark:text-teal-400">{lead.company}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Activity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CRM_ACTIVITY_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                    type === t
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {getActivityIcon(t)}
                  <span className="truncate">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Outcome & Notes *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? e.g. Owner expressed interest in e-invoicing; asked for pricing package for 2 branches."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Update Next Action
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder={lead.nextAction || "e.g. Follow up on Tuesday via WhatsApp"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Logging..." : "Log Activity"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
