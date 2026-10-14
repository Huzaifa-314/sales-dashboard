"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";

// Labelled text input in the shared field style, with an inline error. Used by
// forms and dialogs.
export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  id: idProp,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  required,
  maxLength,
  onBlur,
}: {
  label: string;
  // A line of help under the field
  hint?: string;
  // Set when something else points at the field (an error summary link)
  id?: string;
  maxLength?: number;
  onBlur?: () => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption text-ink-soft">
        {label}
        {required && (
          <span aria-hidden className="text-overdue">
            {" "}
            *
          </span>
        )}
      </label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        required={required}
        invalid={!!error}
        maxLength={maxLength}
        onBlur={onBlur}
        aria-describedby={
          [error ? errorId : null, hint ? hintId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-caption text-overdue">
          {error}
        </p>
      )}
    </div>
  );
}
