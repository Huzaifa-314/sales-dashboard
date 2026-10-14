"use client";

import { useId, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The rest of the form fields, in the same style as TextField: a label above,
// the control, then a hint or an error. Used by every form page.

const labelClass = "mb-1.5 block text-caption text-ink-soft";

function Help({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  if (error)
    return (
      <p id={`${id}-error`} className="mt-1.5 text-caption text-overdue">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-caption text-ink-soft">
        {hint}
      </p>
    );
  return null;
}

// Choose one from a list (state, payment terms)
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
  id: idProp,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  hint?: string;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Help id={id} error={error} hint={hint} />
    </div>
  );
}

// Free text over several lines (notes)
export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  error,
  id: idProp,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  error?: string;
  id?: string;
  maxLength?: number;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div
        className="field-box px-3 py-2"
        data-invalid={error ? "true" : undefined}
      >
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className="block w-full resize-y bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      <Help id={id} error={error} hint={hint} />
    </div>
  );
}

// A tick box with its words beside it. The whole row is the tap target.
export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body text-ink">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      {label}
    </label>
  );
}
