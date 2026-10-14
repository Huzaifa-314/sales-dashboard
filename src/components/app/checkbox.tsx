"use client";

import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";

// shadcn/Radix checkbox inside a 44px tap target. `indeterminate` is for
// select-all.
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <span className="flex size-11 items-center justify-center">
      <UiCheckbox
        aria-label={label}
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
    </span>
  );
}
