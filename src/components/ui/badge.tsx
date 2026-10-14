import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "soft" | "solid" | "outline";

// A small number or word beside a label (tab counts). Same rounded rectangle
// as the status chip, so the system has one chip shape. Not for status: use
// StatusLabel for that.
const variants: Record<Variant, string> = {
  soft: "bg-surface-2 text-ink-soft",
  solid: "bg-primary text-on-primary",
  outline: "border border-line bg-surface-2 text-ink-soft",
};

export function Badge({
  variant = "soft",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "num inline-flex min-h-5 min-w-6 items-center justify-center rounded-control px-1.5 text-caption font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
