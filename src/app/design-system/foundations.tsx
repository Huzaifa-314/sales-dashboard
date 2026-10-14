"use client";

import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Eye,
  FilePlus2,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  contrast,
  Demo,
  DsSection,
  Group,
  Mono,
  Rule,
  swatchStyle,
  useCssVar,
} from "./kit";

// ---- Principles -----------------------------------------------------------

export function Principles() {
  const items = [
    [
      "Premium through restraint",
      "Quiet surfaces, hairline borders, one accent. Nothing decorative that does not carry meaning.",
    ],
    [
      "Numbers are the heroes",
      "Money is large, tabular and aligned. Everything around it steps back.",
    ],
    [
      "Colour means something",
      "Red is overdue. Violet is credit. Cyan is the brand accent. Never decoration.",
    ],
    [
      "Borders over shadows",
      "A 1px line defines a surface. Shadows appear only on things that float.",
    ],
    [
      "Every state is designed",
      "Empty, loading, error, disabled, focus and no-results each have a deliberate look.",
    ],
    [
      "Reachable by everyone",
      "44px targets, a 2px focus ring, 4.5:1 text contrast, keyboard first, light and dark, English and Bahasa Malaysia.",
    ],
  ];
  return (
    <DsSection
      id="principles"
      title="Principles"
      intro="Six rules every screen is checked against. When a decision is unclear, the rule higher up wins."
    >
      <ol className="grid gap-4 md:grid-cols-2">
        {items.map(([title, body], i) => (
          <li
            key={title}
            className="rounded-card border border-line bg-surface p-5"
          >
            <p className="micro">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="t-section mt-1.5">{title}</h3>
            <p className="mt-1.5 text-body text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>
    </DsSection>
  );
}

// ---- Colour ---------------------------------------------------------------

function TokenRow({ token, use }: { token: string; use: string }) {
  const value = useCssVar(token);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden
        style={swatchStyle(token)}
        className="swatch size-10 shrink-0 rounded-control border border-line"
      />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-ink">
          <Mono>{token}</Mono>
        </p>
        <p className="truncate text-caption text-ink-soft">{use}</p>
      </div>
      <span className="num shrink-0 font-mono text-caption text-ink-soft">
        {value || "—"}
      </span>
    </div>
  );
}

function TokenList({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface px-4">
      {rows.map(([token, use]) => (
        <TokenRow key={token} token={token} use={use} />
      ))}
    </div>
  );
}

function ContrastRow({
  fg,
  bg,
  label,
}: {
  fg: string;
  bg: string;
  label: string;
}) {
  const a = useCssVar(fg);
  const b = useCssVar(bg);
  const ratio = contrast(a, b);
  const ok = ratio >= 4.5;
  return (
    <tr className="border-t border-line">
      <td className="py-2.5 pr-4 text-body text-ink">{label}</td>
      <td className="py-2.5 pr-4">
        <Mono>{fg}</Mono> on <Mono>{bg}</Mono>
      </td>
      <td className="num py-2.5 pr-4 text-right text-body">
        {ratio ? `${ratio.toFixed(2)} : 1` : "—"}
      </td>
      <td
        className={`py-2.5 text-right text-caption font-medium ${ok ? "text-paid" : "text-overdue"}`}
      >
        {ok ? "Passes AA" : "Fails"}
      </td>
    </tr>
  );
}

export function Colors() {
  return (
    <DsSection
      id="colors"
      title="Colour"
      intro="Components use semantic tokens only, never a hex value or a Tailwind palette colour. Switch the theme in the top bar and every value here updates: dark mode is the same names with different values."
    >
      <Group
        title="Surfaces and lines"
        note="The canvas is the page; a surface is anything lifted onto it."
      >
        <TokenList
          rows={[
            ["--canvas", "Page background"],
            ["--surface", "Cards, table, top bar, menus"],
            ["--surface-2", "Inputs (dark), hover, selected row, chips"],
            ["--line", "Hairline borders and dividers"],
            [
              "--field",
              "Fill of text fields: the lightest surface, so a field never matches the page behind it",
            ],
            [
              "--field-border",
              "Borders of inputs and outlined buttons (3:1 against the surface)",
            ],
          ]}
        />
      </Group>
      <Group title="Text">
        <TokenList
          rows={[
            ["--ink", "Primary text, headings, amounts"],
            ["--ink-soft", "Secondary text, labels, captions"],
            ["--ink-faint", "Placeholders, disabled text, settled accounts"],
          ]}
        />
      </Group>
      <Group title="Brand and action">
        <TokenList
          rows={[
            [
              "--primary",
              "Main buttons, selected count chips (inverts in dark mode)",
            ],
            ["--primary-hover", "Hover state of primary"],
            ["--table-head", "Table header band (faint cyan tint, never grey)"],
            ["--on-primary", "Text on primary"],
            [
              "--brass",
              "The one accent (cyan; the token keeps its old name): active tab underline, active nav bar, hero rule",
            ],
            ["--focus", "The 2px focus ring (cyan in both themes)"],
          ]}
        />
      </Group>
      <Group
        title="Status"
        note="Each status has a text colour and a soft background. Meaning always comes with a word; colour only supports it."
      >
        <TokenList
          rows={[
            ["--overdue", "Overdue, errors, destructive actions"],
            ["--overdue-bg", "Soft background for overdue"],
            ["--paid", "Paid, success"],
            ["--paid-bg", "Soft background for paid"],
            ["--partly", "Partly paid, caution"],
            ["--partly-bg", "Soft background for partly paid"],
            ["--sent", "Sent, informational"],
            ["--sent-bg", "Soft background for sent"],
            ["--credit", "Customer credit"],
            ["--credit-bg", "Soft background for credit"],
            ["--review", "Needs review"],
            ["--review-bg", "Soft background for review"],
          ]}
        />
      </Group>
      <Group
        title="Contrast, measured live"
        note="Computed from the tokens in the current theme. The same pairs are checked in both themes by npm run check:contrast."
      >
        <div
          tabIndex={0}
          role="region"
          aria-label="Contrast table"
          className="overflow-x-auto rounded-card border border-line bg-surface px-4"
        >
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <th className="micro py-3 pr-4 font-medium">Use</th>
                <th className="micro py-3 pr-4 font-medium">Pair</th>
                <th className="micro py-3 pr-4 text-right font-medium">
                  Ratio
                </th>
                <th className="micro py-3 text-right font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              <ContrastRow label="Body text" fg="--ink" bg="--surface" />
              <ContrastRow
                label="Secondary text"
                fg="--ink-soft"
                bg="--surface"
              />
              <ContrastRow
                label="Faint text"
                fg="--ink-faint"
                bg="--surface-2"
              />
              <ContrastRow
                label="Text on primary"
                fg="--on-primary"
                bg="--primary"
              />
              <ContrastRow label="Overdue text" fg="--overdue" bg="--surface" />
              <ContrastRow label="Credit text" fg="--credit" bg="--surface" />
              <ContrastRow
                label="Paid on its tint"
                fg="--paid"
                bg="--paid-bg"
              />
            </tbody>
          </table>
        </div>
      </Group>
      <div className="grid gap-4 md:grid-cols-2">
        <Rule kind="do">
          Use <Mono>text-ink-soft</Mono>, <Mono>bg-surface-2</Mono>,{" "}
          <Mono>text-overdue</Mono>.
        </Rule>
        <Rule kind="dont">
          Write <Mono>#8f1d1d</Mono>, <Mono>text-red-700</Mono> or{" "}
          <Mono>bg-white</Mono>. <Mono>npm run check:tokens</Mono> fails the
          build.
        </Rule>
      </div>
    </DsSection>
  );
}

// ---- Typography -----------------------------------------------------------

const roles: {
  cls: string;
  name: string;
  spec: string;
  use: string;
  sample: string;
}[] = [
  {
    cls: "t-hero font-serif",
    name: "Hero amount",
    spec: "Newsreader · 36 / 44 · 500 · -0.02em",
    use: "One per screen: the headline figure on Home",
    sample: "RM 95,180.00",
  },
  {
    cls: "t-stat num",
    name: "Stat figure",
    spec: "Geist · 32 · 500 · -0.02em",
    use: "Key amounts in cards",
    sample: "RM 24,760.00",
  },
  {
    cls: "t-title",
    name: "Page title",
    spec: "Geist · 24 / 28 · 600 · -0.01em",
    use: "One h1 per page",
    sample: "Customers",
  },
  {
    cls: "t-section",
    name: "Section title",
    spec: "Geist · 16 / 18 · 600 · -0.01em",
    use: "Card and group headings (h2, h3)",
    sample: "Invoices and payments",
  },
  {
    cls: "text-body",
    name: "Body",
    spec: "Geist · 15 · 400",
    use: "Table text, form values, paragraphs",
    sample: "Everyone you sell to, and what they owe you.",
  },
  {
    cls: "text-caption",
    name: "Caption",
    spec: "Geist · 13 · 400",
    use: "Labels, helper text, secondary lines",
    sample: "3 open invoices",
  },
  {
    cls: "micro",
    name: "Micro-label",
    spec: "Geist Mono · 12 · 500 · caps · +0.06em",
    use: "KPI labels, menu headings. Used sparingly",
    sample: "To collect",
  },
];

export function Typography() {
  return (
    <DsSection
      id="typography"
      title="Typography"
      intro="Type does most of the premium work. Seven roles, one scale. Size, weight, tracking and line height travel together in a class, so a role looks identical on every page."
    >
      <Group title="Roles">
        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {roles.map((r) => (
            <div
              key={r.name}
              className="grid gap-3 p-5 md:grid-cols-[220px_1fr] md:gap-8"
            >
              <div>
                <p className="text-body font-medium text-ink">{r.name}</p>
                <p className="mt-0.5 text-caption text-ink-soft">{r.spec}</p>
                <p className="mt-1.5">
                  <Mono>{r.cls.split(" ")[0]}</Mono>
                </p>
              </div>
              <div className="min-w-0">
                <p className={`${r.cls} truncate text-ink`}>{r.sample}</p>
                <p className="mt-1.5 text-caption text-ink-faint">{r.use}</p>
              </div>
            </div>
          ))}
        </div>
      </Group>
      <Group title="Fonts and numerals">
        <ul className="grid gap-3 text-body text-ink-soft md:grid-cols-3">
          <li className="rounded-card border border-line bg-surface p-4">
            <strong className="text-ink">Geist</strong> for the whole app.
            Sentence case, always.
          </li>
          <li className="rounded-card border border-line bg-surface p-4">
            <strong className="text-ink">Newsreader</strong> only for the hero
            amount and empty or error headlines. Never for data.
          </li>
          <li className="rounded-card border border-line bg-surface p-4">
            <strong className="text-ink">Tabular figures</strong> on every
            amount, so columns line up. Geist Mono only for ledgers.
          </li>
        </ul>
      </Group>
      <div className="grid gap-4 md:grid-cols-2">
        <Rule kind="do">
          Pick a role: <Mono>t-title</Mono>, <Mono>text-body</Mono>,{" "}
          <Mono>text-caption</Mono>.
        </Rule>
        <Rule kind="dont">
          Use <Mono>text-sm</Mono>, <Mono>text-[14px]</Mono> or a custom{" "}
          <Mono>tracking-[…]</Mono>. <Mono>npm run check:type</Mono> fails.
        </Rule>
      </div>
    </DsSection>
  );
}

// ---- Space, shape, elevation ---------------------------------------------

export function SpaceAndShape() {
  const steps = [
    ["1", "w-1", "4"],
    ["2", "w-2", "8"],
    ["3", "w-3", "12"],
    ["4", "w-4", "16"],
    ["6", "w-6", "24"],
    ["8", "w-8", "32"],
    ["12", "w-12", "48"],
    ["16", "w-16", "64"],
  ];
  return (
    <DsSection
      id="space"
      title="Space, shape and elevation"
      intro="A 4-point grid, three corner radii and three floating layers. Nothing in between."
    >
      <Group
        title="Spacing"
        note="Multiples of 4px. Use the Tailwind step (gap-4, p-6, mt-8), never a pixel value."
      >
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-card border border-line bg-surface p-5">
          {steps.map(([step, w, px]) => (
            <div key={step} className="flex flex-col items-start gap-2">
              <span className={`${w} h-8 rounded-chip bg-brass`} aria-hidden />
              <span className="num text-caption text-ink-soft">{px}px</span>
              <Mono>{step}</Mono>
            </div>
          ))}
        </div>
      </Group>
      <Group title="Layout">
        <dl className="grid divide-y divide-line rounded-card border border-line bg-surface px-5 md:grid-cols-2 md:divide-y-0 md:gap-x-10">
          {[
            ["Page gutter", "16px mobile · 32px from 1024 · 40px from 1280"],
            ["Top bar", "56px, sticky, hairline underneath"],
            ["Sidebar", "272px, or 72px collapsed (desktop only)"],
            [
              "Control height",
              "44px default · 36px small (table rows and toolbars)",
            ],
            ["Tap target", "44px minimum on touch"],
            ["Table row", "68px comfortable · 52px compact"],
            ["Breakpoints", "sm 640 · md 768 · lg 1024 · xl 1280"],
            ["Phones", "Tables become lists below 768px"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="text-caption text-ink-soft">{k}</dt>
              <dd className="text-right text-body text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Group>
      <Group
        title="Radius"
        note="Rounder than this is only for dots, avatars and pills."
      >
        <div className="flex flex-wrap gap-6 rounded-card border border-line bg-surface p-5">
          {[
            ["rounded-chip", "4px", "Checkbox, inner segment"],
            ["rounded-control", "6px", "Buttons, inputs, menu items"],
            ["rounded-card", "10px", "Cards, dialogs, menus"],
          ].map(([cls, px, use]) => (
            <div key={cls} className="w-40">
              <div
                className={`${cls} h-16 border border-field-border bg-surface-2`}
              />
              <p className="mt-2 text-body text-ink">
                <Mono>{cls}</Mono>
              </p>
              <p className="text-caption text-ink-soft">
                {px} · {use}
              </p>
            </div>
          ))}
        </div>
      </Group>
      <Group
        title="Elevation"
        note="Borders define surfaces. Shadows are only for things that float over the page."
      >
        <div className="grid gap-6 rounded-card border border-line bg-canvas p-6 md:grid-cols-3">
          {[
            ["shadow-float", "Tooltips, floating bar"],
            ["shadow-pop", "Menus, popovers, dialogs"],
            ["shadow-toast", "Toasts"],
          ].map(([cls, use]) => (
            <div key={cls}>
              <div
                className={`${cls} h-16 rounded-card border border-line bg-surface`}
              />
              <p className="mt-3 text-body text-ink">
                <Mono>{cls}</Mono>
              </p>
              <p className="text-caption text-ink-soft">{use}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-caption text-ink-soft">
          Two hairline helpers: <Mono>shadow-ring</Mono> (selected segment) and{" "}
          <Mono>shadow-rule</Mono> (the sticky table header&apos;s bottom line).
        </p>
      </Group>
    </DsSection>
  );
}

// ---- Motion and layers ----------------------------------------------------

export function MotionAndLayers() {
  const [n, setN] = useState(0);
  return (
    <DsSection
      id="motion"
      title="Motion and layers"
      intro="Motion explains a change; it never performs. Everything is off for people who ask for reduced motion."
    >
      <Group title="Motion">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-body font-medium text-ink">
              Colour and border changes
            </p>
            <p className="mt-1 text-caption text-ink-soft">
              <Mono>transition-colors duration-150</Mono> on every interactive
              element.
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-body font-medium text-ink">Entering overlays</p>
            <p className="mt-1 text-caption text-ink-soft">
              <Mono>animate-rise</Mono> (160ms, 6px) for popovers, the bulk bar,
              toasts.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setN((v) => v + 1)}
              >
                Replay
              </Button>
              <div
                key={n}
                className="animate-rise rounded-control border border-line bg-surface-2 px-3 py-1.5 text-caption text-ink"
              >
                Hello
              </div>
            </div>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-body font-medium text-ink">Loading</p>
            <p className="mt-1 text-caption text-ink-soft">
              Skeleton blocks pulse slowly. Never a spinner over a whole page.
            </p>
          </div>
        </div>
      </Group>
      <Group
        title="Layers"
        note="A stacking decision uses a name, never a number."
      >
        <div
          tabIndex={0}
          role="region"
          aria-label="Layers table"
          className="overflow-x-auto rounded-card border border-line bg-surface px-4"
        >
          <table className="w-full min-w-[480px] border-collapse text-left">
            <tbody>
              {[
                ["z-sticky", "5", "Sticky table header inside the page"],
                ["z-header", "10", "Top bar, mobile bottom bar"],
                [
                  "z-float",
                  "20",
                  "Tooltips of the collapsed sidebar, the bulk bar, the account menu",
                ],
                ["z-overlay", "50", "Dropdowns, popovers, dialogs, toasts"],
              ].map(([cls, n2, use]) => (
                <tr key={cls} className="border-t border-line first:border-t-0">
                  <td className="py-2.5 pr-4">
                    <Mono>{cls}</Mono>
                  </td>
                  <td className="num py-2.5 pr-4 text-body text-ink-soft">
                    {n2}
                  </td>
                  <td className="py-2.5 text-body text-ink">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Group>
    </DsSection>
  );
}

// ---- Icons ----------------------------------------------------------------

const icons: [string, LucideIcon][] = [
  ["Search", Search],
  ["Plus", Plus],
  ["Calendar", Calendar],
  ["Download", Download],
  ["Send", Send],
  ["Wallet", Wallet],
  ["FilePlus2", FilePlus2],
  ["Eye", Eye],
  ["MoreHorizontal", MoreHorizontal],
  ["ChevronDown", ChevronDown],
  ["Check", Check],
  ["X", X],
  ["AlertCircle", AlertCircle],
];

export function Icons() {
  return (
    <DsSection
      id="icons"
      title="Icons"
      intro="Lucide only. Icons accompany text; they do not replace it, except where a tooltip and an accessible name say what the icon does."
    >
      <Group title="Sizes and stroke">
        <Demo>
          <div className="flex flex-wrap items-end gap-8">
            {[16, 18, 20, 24].map((s) => (
              <div
                key={s}
                className="flex flex-col items-center gap-2 text-ink"
              >
                <Send size={s} strokeWidth={1.5} aria-hidden />
                <span className="num text-caption text-ink-soft">{s}px</span>
              </div>
            ))}
            <p className="max-w-sm text-caption text-ink-soft">
              Stroke 1.5, always. 18px in buttons and menus, 20px for page-level
              actions, 16px inside small buttons and dense tables. Mark
              decorative icons <Mono>aria-hidden</Mono>.
            </p>
          </div>
        </Demo>
      </Group>
      <Group title="In use">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {icons.map(([name, Icon]) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                aria-hidden
                className="text-ink"
              />
              <span className="truncate text-caption text-ink-soft">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Group>
    </DsSection>
  );
}
