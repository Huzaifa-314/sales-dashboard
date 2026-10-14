"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Users, Trash2, Shield, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Membership, Role, SubscriptionTier } from "@/lib/crm/types.ts";
import { toast } from "sonner";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing?: () => void;
  currentTier?: SubscriptionTier;
  userQuotaLimit?: number;
}

export function TeamModal({
  isOpen,
  onClose,
  onOpenPricing,
  currentTier,
  userQuotaLimit: propUserQuotaLimit,
}: TeamModalProps) {
  const [members, setMembers] = useState<Membership[]>([]);
  const [userQuotaLimit, setUserQuotaLimit] = useState(1);
  const [loading, setLoading] = useState(false);

  // Invite Form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("SALES_REP");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTeam() {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setUserQuotaLimit(data.userQuotaLimit || 1);
      }
    } catch (err) {
      console.error("Failed to load team members", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadTeam();
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    try {
      setInviting(true);
      const res = await fetch("/api/crm/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite member");
      }

      toast.success(`Invited ${email} as ${role}`);
      setEmail("");
      setName("");
      loadTeam();
    } catch (err: any) {
      setError(err.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Remove ${email} from workspace?`)) return;

    try {
      const res = await fetch(`/api/crm/team?userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove member");
      }

      toast.success(`Removed ${email}`);
      loadTeam();
    } catch (err: any) {
      toast.error(err.message || "Could not remove member");
    }
  }

  const isSeatLimitReached = members.length >= userQuotaLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Team & Access Control (RBAC)
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Seats Used: <strong>{members.length}</strong> of{" "}
              <strong>{userQuotaLimit}</strong> allowed seats
            </p>
          </div>

          {isSeatLimitReached && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                if (onOpenPricing) onOpenPricing();
              }}
              className="text-xs font-semibold text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800"
            >
              Upgrade Seats
            </Button>
          )}
        </div>

        {/* Invite Member Section */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 mb-6">
          <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-teal-600" />
            Invite New Teammate
          </h3>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                type="text"
                placeholder="Teammate Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="text-xs px-2.5 py-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <option value="SALES_REP">Sales Rep (Leads & Tasks)</option>
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="VIEWER">Viewer (Read Only)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={inviting || isSeatLimitReached}
                size="sm"
                className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {inviting ? "Inviting..." : isSeatLimitReached ? "Seat Limit Reached" : "Send Workspace Invite"}
              </Button>
            </div>
          </form>
        </div>

        {/* Members List */}
        <div>
          <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-3">
            Active Members ({members.length})
          </h3>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((mem) => {
              const isOwner = mem.role === "OWNER";
              return (
                <div
                  key={mem.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                      {(mem.user?.name || mem.user?.email || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {mem.user?.name || "Team Member"}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {mem.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOwner
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : mem.role === "ADMIN"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {mem.role}
                    </span>

                    {!isOwner && (
                      <button
                        onClick={() =>
                          handleRemove(mem.userId, mem.user?.email || mem.userId)
                        }
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
