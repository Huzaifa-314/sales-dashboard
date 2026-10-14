"use client";

import { useId, useState, type ReactNode } from "react";
import { panelId, tabId, TabBar } from "@/components/app/tab-bar";

type Tab = { id: string; label: string; panel: ReactNode };

// Tabs that each own a panel (dashboard). The bar itself is the shared TabBar.
export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const prefix = useId();

  return (
    <div>
      <TabBar
        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
        value={active}
        onChange={setActive}
        label={label}
        idPrefix={prefix}
      />
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={panelId(prefix, t.id)}
          aria-labelledby={tabId(prefix, t.id)}
          hidden={t.id !== active}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
