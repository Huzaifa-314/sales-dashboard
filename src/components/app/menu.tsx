"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Hint } from "@/components/app/hint";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MenuItem =
  | {
      label: string;
      icon?: LucideIcon;
      // Either run something, or go to a page (a real link, so it can be
      // opened in a new tab).
      onSelect?: () => void;
      href?: string;
      // A small tag at the end of the row, e.g. "Soon".
      badge?: string;
      danger?: boolean;
    }
  | { heading: string }
  | "separator";

// Dropdown for row and toolbar actions, on the shadcn/Radix dropdown menu:
// collision-aware placement, arrow-key and type-ahead navigation, Esc to close
// and focus returned to the trigger.
export function Menu({
  label,
  items,
  heading,
  hint,
  children,
  triggerClassName,
  open,
  onOpenChange,
}: {
  label: string;
  items: MenuItem[];
  heading?: string;
  // Hover/focus tooltip for an icon-only trigger.
  hint?: string;
  children: ReactNode;
  triggerClassName: string;
  // Optional: let the page open the menu (a keyboard shortcut).
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <Hint label={hint}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={label} className={triggerClassName}>
            {children}
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" aria-label={label}>
        {heading && <DropdownMenuLabel>{heading}</DropdownMenuLabel>}
        {items.map((item, i) =>
          item === "separator" ? (
            <DropdownMenuSeparator key={`sep-${i}`} />
          ) : "heading" in item ? (
            <DropdownMenuLabel key={`head-${item.heading}`}>
              {item.heading}
            </DropdownMenuLabel>
          ) : (
            <DropdownMenuItem
              key={item.label}
              variant={item.danger ? "destructive" : "default"}
              onSelect={item.onSelect}
              asChild={!!item.href}
            >
              {item.href ? (
                <Link href={item.href}>
                  <MenuRow item={item} />
                </Link>
              ) : (
                <MenuRow item={item} />
              )}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuRow({
  item,
}: {
  item: Exclude<MenuItem, "separator" | { heading: string }>;
}) {
  return (
    <>
      {item.icon && <item.icon size={18} strokeWidth={1.5} aria-hidden />}
      {item.label}
      {item.badge && (
        <span className="ml-auto pl-4 text-micro text-ink-faint">
          {item.badge}
        </span>
      )}
    </>
  );
}
