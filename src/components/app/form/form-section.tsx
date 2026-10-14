"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/app/card";

// One card of a form: a title, one line saying why we ask, then the fields. A
// collapsible section (tax numbers, notes) starts closed for what is optional;
// the form opens it itself when a field inside has an error.
export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  open = true,
  onToggle,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const bodyId = useId();
  const head = (
    <>
      <span className="min-w-0 text-left">
        <span className="t-section block">{title}</span>
        {description && (
          <span className="mt-0.5 block text-caption font-normal text-ink-soft">
            {description}
          </span>
        )}
      </span>
      {collapsible && (
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className={`shrink-0 text-ink-faint transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
      )}
    </>
  );
  return (
    <Card className="overflow-hidden">
      {collapsible ? (
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={onToggle}
            className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-surface-2"
          >
            {head}
          </button>
        </h2>
      ) : (
        <h2 className="flex min-h-14 items-center justify-between gap-4 px-5 py-3">
          {head}
        </h2>
      )}
      {open && (
        <div
          id={bodyId}
          className="grid gap-4 border-t border-line px-5 py-5 sm:grid-cols-2"
        >
          {children}
        </div>
      )}
    </Card>
  );
}
