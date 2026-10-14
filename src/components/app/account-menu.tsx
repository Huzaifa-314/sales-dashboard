"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Monitor,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Hint } from "@/components/app/hint";
import { segmentClass } from "@/components/app/segmented";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MessageKey } from "@/i18n/messages";
import {
  useLang,
  useT,
  useThemePref,
  type Lang,
  type ThemePref,
} from "@/components/app/preferences";

const themes: { value: ThemePref; label: MessageKey; icon: LucideIcon }[] = [
  { value: "light", label: "account.light", icon: Sun },
  { value: "dark", label: "account.dark", icon: Moon },
  { value: "auto", label: "account.auto", icon: Monitor },
];

const languages: { value: Lang; name: string }[] = [
  { value: "en", name: "English" },
  { value: "ms", name: "Bahasa Malaysia" },
];

function Segmented({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-control bg-surface-2 p-1"
    >
      {children}
    </div>
  );
}

// The account panel on the shadcn/Radix popover: outside click, Esc, focus
// return and collision-aware placement come from the component. It is a panel
// of settings, not a list of commands, so it is a popover and not a menu.
export function AccountMenu() {
  const t = useT();
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [theme, setTheme] = useThemePref();
  const [user, setUser] = useState<{ name?: string | null; email?: string; role?: string } | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/crm/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({
            name: data.user?.name,
            email: data.user?.email,
            role: data.role,
          });
        }
      } catch {}
    }
    loadMe();
    window.addEventListener("crm:auth-change", loadMe);
    return () => window.removeEventListener("crm:auth-change", loadMe);
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/crm/auth/logout", { method: "POST" });
      toast.success("Signed out successfully.");
      window.dispatchEvent(new CustomEvent("crm:auth-change"));
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-body text-ink transition-colors duration-150 hover:bg-surface-2";

  return (
    <Popover>
      <Hint label={t("top.accountMenu")}>
        <PopoverTrigger
          aria-label={t("top.accountMenu")}
          className="flex min-h-11 items-center gap-2 rounded-control px-1.5 text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full border border-field-border bg-surface-2 text-ink font-medium text-caption"
          >
            {user?.name ? user.name[0].toUpperCase() : <User size={16} strokeWidth={1.5} />}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="max-sm:hidden"
          />
        </PopoverTrigger>
      </Hint>

      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label={t("top.accountMenu")}
        className="w-80 p-2"
      >
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-body font-medium text-ink truncate">
              {user?.name || t("account.yourAccount")}
            </p>
            {user?.role && (
              <span className="shrink-0 rounded bg-surface-2 border border-line px-1.5 py-0.5 text-micro font-mono text-ink-soft">
                {user.role}
              </span>
            )}
          </div>
          <p className="text-caption text-ink-soft truncate">
            {user?.email || t("sidebar.company")}
          </p>
        </div>

        <div className="border-t border-line px-3 py-3">
          <p className="micro mb-2">{t("account.theme")}</p>
          <Segmented label={t("account.theme")}>
            {themes.map((th) => (
              <button
                key={th.value}
                type="button"
                aria-pressed={theme === th.value}
                onClick={() => setTheme(th.value)}
                className={segmentClass(theme === th.value)}
              >
                <th.icon size={16} strokeWidth={1.5} aria-hidden />
                {t(th.label)}
              </button>
            ))}
          </Segmented>
        </div>

        <div className="border-t border-line px-3 py-3">
          <p className="micro mb-2">{t("top.language")}</p>
          <Segmented label={t("top.language")}>
            {languages.map((l) => (
              <button
                key={l.value}
                type="button"
                lang={l.value}
                aria-pressed={lang === l.value}
                onClick={() => setLang(l.value)}
                className={segmentClass(lang === l.value)}
              >
                {l.name}
              </button>
            ))}
          </Segmented>
        </div>

        <div className="border-t border-line pt-2">
          <Link href="/settings" className={item}>
            <Settings size={20} strokeWidth={1.5} aria-hidden />
            {t("account.workspaceSettings")}
          </Link>
          <button type="button" onClick={handleSignOut} className={item}>
            <LogOut size={20} strokeWidth={1.5} aria-hidden />
            {t("account.signOut")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
