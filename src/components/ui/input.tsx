import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one text field. A bordered box (see .field-box in globals.css) holding a
// bare <input>, with an optional leading icon and trailing slot. Focus shows on
// the box as a 2px ring; the input itself never draws an outline.
export function Input({
  icon,
  trailing,
  invalid = false,
  className,
  boxClassName,
  ...props
}: ComponentProps<"input"> & {
  icon?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  // Classes for the box (width, height); `className` goes to the <input>.
  boxClassName?: string;
}) {
  return (
    <div
      className={cn(
        "field-box flex min-h-11 items-center gap-2.5 px-3",
        boxClassName,
      )}
      data-invalid={invalid ? "true" : undefined}
    >
      {icon}
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:text-ink-faint",
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  );
}
