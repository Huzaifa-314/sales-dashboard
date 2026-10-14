"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark, Wordmark } from "@/components/app/logo";
import { useLang, useT, useThemePref, type Lang } from "@/components/app/preferences";
import { buttonClass } from "@/components/ui/button";

interface DemoPersona {
  roleName: string;
  badge: string;
  email: string;
  name: string;
  role: string;
  description: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    roleName: "Founder (Owner)",
    badge: "Owner",
    email: "founder@salesdashboard.my",
    name: "Lead Sales Director",
    role: "OWNER",
    description: "Full workspace sovereignty, revenue targets & team management.",
  },
  {
    roleName: "Sarah Lim (Closer)",
    badge: "Sales Rep",
    email: "sarah@salesdashboard.my",
    name: "Sarah Lim",
    role: "SALES_REP",
    description: "Deal qualification, WhatsApp outreach, activity logging.",
  },
  {
    roleName: "Alex Tan (Ops)",
    badge: "Admin",
    email: "alex@salesdashboard.my",
    name: "Alex Tan",
    role: "ADMIN",
    description: "Team quota limits, audit logs, and enterprise integrations.",
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="flex items-center gap-2 text-ink-soft">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Loading workspace authentication…</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [lang, setLang] = useLang();
  const [theme, setTheme] = useThemePref();

  const [email, setEmail] = useState("founder@salesdashboard.my");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activePersona, setActivePersona] = useState<string>("founder@salesdashboard.my");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);

  function selectPersona(persona: DemoPersona) {
    setEmail(persona.email);
    setPassword("password123");
    setActivePersona(persona.email);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage(t("login.emailLabel") + " is required.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(t("login.passwordLabel") + " must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/crm/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      toast.success(t("login.success", { name: data.user.name || "Sales Executive" }));
      window.dispatchEvent(new CustomEvent("crm:auth-change"));

      // Small delay for smooth transition
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 150);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-canvas text-ink antialiased">
      {/* Subtle top branding bar */}
      <header className="w-full border-b border-line bg-surface/80 backdrop-blur-sm px-4 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <Wordmark endorsement size={32} />
        </Link>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="inline-flex rounded-control border border-line bg-surface-2 p-0.5 text-micro">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded transition-colors ${
                lang === "en" ? "bg-surface font-semibold text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang("ms")}
              className={`px-2.5 py-1 rounded transition-colors ${
                lang === "ms" ? "bg-surface font-semibold text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              Melayu
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex size-8 items-center justify-center rounded-control text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === "dark" ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px] animate-in fade-in-50 duration-200">
          {/* Card Container with hairline brass border */}
          <div className="relative overflow-hidden rounded-card border border-line bg-surface p-6 sm:p-8 shadow-sm">
            {/* Top decorative hairline accent (InvoisPro quiet brass signature) */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brass to-transparent opacity-80"
            />

            {/* Header copy */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-field-border bg-surface-2 text-ink shadow-xs">
                <LogoMark size={28} />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink font-serif">
                {t("login.title")}
              </h1>
              <p className="mt-1.5 text-caption text-ink-soft">
                {t("login.subtitle")}
              </p>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="mb-6 rounded-control border border-line bg-surface-2 p-2">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-micro font-medium text-ink-faint uppercase tracking-wider">
                  {t("login.demoHeading")}
                </span>
                <span className="text-micro text-brass font-medium">1-Click Login</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_PERSONAS.map((p) => {
                  const isSelected = activePersona === p.email;
                  return (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => selectPersona(p)}
                      className={`flex flex-col items-center justify-center p-2 rounded text-center transition-all ${
                        isSelected
                          ? "bg-surface text-ink font-semibold border border-line shadow-xs"
                          : "text-ink-soft hover:bg-surface/50 hover:text-ink"
                      }`}
                    >
                      <span className="text-caption truncate w-full font-medium">
                        {p.badge}
                      </span>
                      <span className="text-micro text-ink-faint truncate w-full">
                        {p.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-control border border-overdue/40 bg-overdue-bg p-3 text-caption text-overdue"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-caption font-medium text-ink mb-1.5"
                >
                  {t("login.emailLabel")}
                </label>
                <div className="field-box relative flex items-center px-3 py-2">
                  <Mail size={16} strokeWidth={1.5} className="mr-2.5 text-ink-faint shrink-0" />
                  <input
                    id="email-input"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setActivePersona("");
                    }}
                    placeholder={t("login.emailPlaceholder")}
                    className="w-full bg-transparent text-body text-ink placeholder:text-ink-faint focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password-input"
                    className="block text-caption font-medium text-ink"
                  >
                    {t("login.passwordLabel")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-caption text-ink-soft hover:text-ink hover:underline transition-colors"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>
                <div className="field-box relative flex items-center px-3 py-2">
                  <Lock size={16} strokeWidth={1.5} className="mr-2.5 text-ink-faint shrink-0" />
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-body text-ink placeholder:text-ink-faint focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="ml-2 text-ink-faint hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-field-border text-primary focus:ring-primary accent-primary"
                />
                <label
                  htmlFor="remember-me"
                  className="text-caption text-ink-soft select-none cursor-pointer"
                >
                  {t("login.rememberMe")}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${buttonClass(
                  "primary",
                  "md",
                  "w-full min-h-11 justify-center gap-2 font-medium tracking-tight shadow-xs",
                )} ${isSubmitting ? "opacity-80 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t("login.signingIn")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("login.submit")}</span>
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password Modal Dialog */}
            {forgotModal && (
              <div className="mt-4 rounded-control border border-line bg-surface-2 p-3 text-caption text-ink-soft">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                    <p>{t("login.forgotNotice")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="text-micro font-semibold text-ink hover:underline ml-2"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security & Endorsement Assurance */}
          <div className="mt-6 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-micro text-ink-faint">
              <ShieldCheck size={14} className="text-brass shrink-0" />
              <span>{t("login.securityNote")}</span>
            </div>
            <p className="text-micro text-ink-faint">
              Endorsed by{" "}
              <a
                href="https://www.infinitatech.com"
                target="_blank"
                rel="noreferrer"
                className="text-ink-soft underline hover:text-ink font-medium"
              >
                Infinita Tech Solutions
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line py-3 px-4 text-center text-micro text-ink-faint">
        © {new Date().getFullYear()} SalesPro · High-Velocity B2B Pipeline & CRM Engine
      </footer>
    </div>
  );
}
