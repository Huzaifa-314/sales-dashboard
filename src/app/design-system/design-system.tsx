"use client";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import {
  Buttons,
  DataDisplay,
  Feedback,
  Fields,
  Navigation,
  Overlays,
} from "./gallery";
import {
  Colors,
  Icons,
  MotionAndLayers,
  Principles,
  SpaceAndShape,
  Typography,
} from "./foundations";
import { DsSection, Mono } from "./kit";

const toc = [
  ["principles", "Principles"],
  ["colors", "Colour"],
  ["typography", "Typography"],
  ["space", "Space and shape"],
  ["motion", "Motion and layers"],
  ["icons", "Icons"],
  ["buttons", "Buttons"],
  ["fields", "Fields"],
  ["navigation", "Navigation"],
  ["data", "Data display"],
  ["overlays", "Menus and dialogs"],
  ["feedback", "States and pages"],
  ["rules", "How to add to it"],
];

function Rules() {
  return (
    <DsSection
      id="rules"
      title="How to add to the system"
      intro="The system only works if there is one way to do each thing. Before adding anything, check this page."
    >
      <ol className="grid gap-3">
        {[
          [
            "Look here first.",
            "If a component or token for it exists, use it. If it is close, extend it with a variant; do not copy it.",
          ],
          [
            "Tokens, not values.",
            "Colours, radii, shadows and layers come from globals.css. The guard fails the build on a raw value.",
          ],
          [
            "Primitives live in components/ui,",
            "app patterns in components/app, pages only compose. A page never builds its own button, field or tab.",
          ],
          [
            "Design every state.",
            "Default, hover, focus, active, disabled, loading, empty, error. Add each to this page with the component.",
          ],
          [
            "Text goes through i18n.",
            "English and Bahasa Malaysia for every string, including aria-labels. This page is the one exception: it is for the team.",
          ],
          [
            "Run the checks.",
            "npm run check (colour contrast, type scale, tokens), then lint and typecheck, before a pull request.",
          ],
        ].map(([lead, rest], i) => (
          <li
            key={lead}
            className="flex gap-4 rounded-card border border-line bg-surface p-4"
          >
            <span className="num w-5 shrink-0 text-ink-faint">{i + 1}</span>
            <p className="text-body text-ink-soft">
              <strong className="font-medium text-ink">{lead}</strong> {rest}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-body text-ink-soft">
        The written guide lives in <Mono>docs/design-system/README.md</Mono>.
        This page is the live reference; the guide explains the reasoning.
      </p>
    </DsSection>
  );
}

export function DesignSystem() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="InvoisPro"
        title="Design system"
        subtitle="Tokens, components and patterns, rendered live from the same code the app uses. Switch light or dark and English or Bahasa Malaysia in the top bar."
      />
      <div className="mt-8 grid gap-10 xl:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden xl:block">
          <ul className="sticky top-20 flex flex-col gap-0.5">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block rounded-control px-3 py-1.5 text-caption text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-14 pb-16">
          <Principles />
          <Colors />
          <Typography />
          <SpaceAndShape />
          <MotionAndLayers />
          <Icons />
          <Buttons />
          <Fields />
          <Navigation />
          <DataDisplay />
          <Overlays />
          <Feedback />
          <Rules />
        </div>
      </div>
    </AppShell>
  );
}
