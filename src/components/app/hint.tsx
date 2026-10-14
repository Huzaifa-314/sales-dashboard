"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// The one way to give hover (and keyboard-focus) help. Never use a native
// `title` attribute: it is slow, unstyled, ignores the theme and does nothing
// from the keyboard or on touch.
//
// A hint names or completes something already on screen. It never holds the
// only copy of important information.
export function Hint({
  label,
  side,
  disabled = false,
  children,
}: {
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  // Skip the tooltip (for example when the control already shows its label).
  disabled?: boolean;
  // A single element that can take a ref: a button, a link, a span.
  children: ReactNode;
}) {
  if (disabled || !label) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

// Text that is cut off with an ellipsis. Hovering it shows the full text, but
// only when it really is cut off, so fully visible text never gets a pointless
// tooltip.
export function TruncatedText({
  children,
  className,
  side,
}: {
  children: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        const el = ref.current;
        setOpen(next && !!el && el.scrollWidth > el.clientWidth + 1);
      }}
    >
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("block truncate", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{children}</TooltipContent>
    </Tooltip>
  );
}
