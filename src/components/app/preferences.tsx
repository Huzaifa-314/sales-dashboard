"use client";

import { useEffect, useSyncExternalStore } from "react";
import { messages, type MessageKey } from "@/i18n/messages";
import { createPrefStore } from "@/lib/pref-store";

export type Lang = "en" | "ms";
export type ThemePref = "light" | "dark" | "auto";

const langStore = createPrefStore<Lang>("invoispro:lang", "en", ["en", "ms"]);
const themeStore = createPrefStore<ThemePref>("invoispro:theme", "auto", [
  "light",
  "dark",
  "auto",
]);

const DARK_QUERY = "(prefers-color-scheme: dark)";

// ---- Language -------------------------------------------------------------

export function useLang() {
  const lang = useSyncExternalStore(
    langStore.subscribe,
    langStore.get,
    langStore.getServer,
  );
  return [lang, langStore.set] as const;
}

export function useT() {
  const [lang] = useLang();
  return (key: MessageKey, vars?: Record<string, string | number>) => {
    let text: string = messages[lang][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

// ---- Theme ----------------------------------------------------------------

export function useThemePref() {
  const pref = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.get,
    themeStore.getServer,
  );
  return [pref, themeStore.set] as const;
}

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function systemPrefersDark() {
  return window.matchMedia(DARK_QUERY).matches;
}

// The theme actually shown ("auto" resolved against the device setting).
export function useResolvedTheme(): "light" | "dark" {
  const [pref] = useThemePref();
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    systemPrefersDark,
    () => false,
  );
  return pref === "dark" || (pref === "auto" && systemDark) ? "dark" : "light";
}

// Mount once in the root layout: keeps <html lang> and data-theme in step with
// the stores. The inline script in layout.tsx sets both before first paint.
export function PreferencesSync() {
  const [lang] = useLang();
  const theme = useResolvedTheme();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
