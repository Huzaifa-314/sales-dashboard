"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Menu, type MenuItem } from "@/components/app/menu";
import { useT } from "@/components/app/preferences";
import { LeadModal } from "@/components/leads/lead-modal.tsx";
import { TeamModal } from "@/components/team/team-modal.tsx";
import { buttonClass } from "@/components/ui/button";

// The one "+ New" button in the top bar: whatever you are doing, creating
// a new lead, scheduling outreach, setting targets, or inviting reps is one click (or the N key) away.
export function CreateMenu() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  // N opens the menu, unless the user is typing in a field or a modal is open.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "n") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      if (document.querySelector("[role='dialog'], [role='menu']")) return;
      e.preventDefault();
      setMenuOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleCreateLead(leadData: any) {
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lead");
      }
      const data = await res.json();
      toast.success(`Created lead: ${data.lead?.company || leadData.company}`);
      setLeadModalOpen(false);
      window.dispatchEvent(new CustomEvent("crm:reload"));
      if (pathname !== "/leads" && pathname !== "/pipeline") {
        router.push("/leads");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
      throw err;
    }
  }

  const items: MenuItem[] = [
    { heading: t("create.group.pipeline") },
    {
      label: t("create.lead"),
      icon: UserPlus,
      onSelect: () => setLeadModalOpen(true),
    },
    {
      label: t("create.task"),
      icon: CalendarClock,
      href: "/tasks",
    },
    {
      label: t("create.activity"),
      icon: MessageSquare,
      href: "/activities",
    },
    "separator",
    { heading: t("create.group.operations") },
    {
      label: t("create.target"),
      icon: TrendingUp,
      href: "/targets",
    },
    {
      label: t("create.team"),
      icon: Users,
      onSelect: () => setTeamModalOpen(true),
    },
    "separator",
    { heading: t("create.group.ai") },
    {
      label: t("create.aiPrompt"),
      icon: Sparkles,
      href: "/ai",
    },
  ];

  return (
    <>
      <Menu
        label={t("create.label")}
        hint={t("create.hint")}
        items={items}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        triggerClassName={buttonClass(
          "secondary",
          "sm",
          "min-h-10 gap-1.5 pl-3 pr-2.5 text-body",
        )}
      >
        <Plus size={18} strokeWidth={1.75} aria-hidden />
        <span>{t("nav.create")}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="text-ink-faint"
        />
      </Menu>

      <LeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSave={handleCreateLead}
      />

      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
      />
    </>
  );
}
