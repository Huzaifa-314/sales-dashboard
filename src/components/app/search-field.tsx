"use client";

import { useId } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  labelVisible = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
  // Show the label above the field (filter bars) instead of screen-reader only.
  labelVisible?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          labelVisible ? "mb-1.5 block text-caption text-ink-soft" : "sr-only"
        }
      >
        {label}
      </label>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          icon={
            <Search
              size={18}
              strokeWidth={1.5}
              aria-hidden
              className="shrink-0 text-ink-faint"
            />
          }
        />
      </form>
    </div>
  );
}
