"use client";

import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

// After a failed save: how many things to fix, each a link to its field. It
// takes focus so a screen reader reads it out, and sighted people see it.
export const ErrorSummary = forwardRef<
  HTMLDivElement,
  {
    title: string;
    items: { id: string; label: string; message: string }[];
  }
>(function ErrorSummary({ title, items }, ref) {
  if (items.length === 0) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-card border border-overdue bg-overdue-bg px-5 py-4 text-overdue outline-none"
    >
      <p className="flex items-center gap-2 text-body font-semibold">
        <AlertCircle size={18} strokeWidth={1.5} aria-hidden />
        {title}
      </p>
      <ul className="mt-2 grid gap-1 pl-6 text-body">
        {items.map((i) => (
          <li key={i.id} className="list-disc">
            <a
              href={`#${i.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(i.id);
                el?.scrollIntoView({ block: "center" });
                el?.focus();
              }}
              className="underline underline-offset-4"
            >
              {i.label}
            </a>
            : {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
});
