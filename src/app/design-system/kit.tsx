"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// Building blocks for the design-system page itself.

// Section with an anchor, title and one line of intent.
export function DsSection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line pt-10">
      <h2 className="t-title">{title}</h2>
      {intro && (
        <p className="mt-2 max-w-2xl text-body text-ink-soft">{intro}</p>
      )}
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  );
}

// A named group inside a section.
export function Group({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="t-section">{title}</h3>
      {note && <p className="mt-1 max-w-2xl text-body text-ink-soft">{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// A live example on a card, with a caption saying what it shows.
export function Demo({
  caption,
  children,
  className = "",
}: {
  caption?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className="min-w-0">
      <div
        className={`rounded-card border border-line bg-surface p-5 ${className}`}
      >
        {children}
      </div>
      {caption && (
        <figcaption className="mt-2 text-caption text-ink-soft">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function Rule({
  kind,
  children,
}: {
  kind: "do" | "dont";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-card border p-4 text-body ${
        kind === "do" ? "border-line bg-paid-bg" : "border-line bg-overdue-bg"
      }`}
    >
      <p
        className={`micro mb-1.5 ${kind === "do" ? "!text-paid" : "!text-overdue"}`}
      >
        {kind === "do" ? "Do" : "Don't"}
      </p>
      <div className="text-ink">{children}</div>
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-chip bg-surface-2 px-1.5 py-0.5 font-mono text-caption text-ink">
      {children}
    </code>
  );
}

// ---- live token values ----------------------------------------------------
// Reads a CSS variable from <html> and follows the light/dark switch, so the
// numbers on this page are always the real ones.
function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}

export function useCssVar(name: string) {
  return useSyncExternalStore(
    subscribeTheme,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => "",
  );
}

// WCAG contrast ratio of two #rrggbb colours.
function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 0;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function swatchStyle(token: string) {
  return { background: `var(${token})` };
}
