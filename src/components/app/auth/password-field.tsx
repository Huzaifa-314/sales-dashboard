"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Hint } from "@/components/app/hint";
import { useT } from "@/components/app/preferences";
import { Input } from "@/components/ui/input";

// A password box with a show/hide toggle, in the same style as TextField.
export function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  below,
  id: idProp,
  autoComplete,
  onBlur,
  trailingLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  // Anything shown under the box instead of a hint (the password rules)
  below?: React.ReactNode;
  id?: string;
  autoComplete: "current-password" | "new-password";
  onBlur?: () => void;
  // Sits on the label line, at the right (a "Forgot password?" link)
  trailingLabel?: React.ReactNode;
}) {
  const t = useT();
  const auto = useId();
  const id = idProp ?? auto;
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const toggle = t(shown ? "auth.hidePassword" : "auth.showPassword");
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-caption text-ink-soft">
          {label}
        </label>
        {trailingLabel}
      </div>
      <Input
        id={id}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        invalid={!!error}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
        onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
        autoCapitalize="none"
        spellCheck={false}
        trailing={
          <Hint label={toggle}>
            <button
              type="button"
              onClick={() => setShown((s) => !s)}
              aria-label={toggle}
              aria-pressed={shown}
              className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-control text-ink-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              {shown ? (
                <EyeOff size={18} strokeWidth={1.5} aria-hidden />
              ) : (
                <Eye size={18} strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </Hint>
        }
      />
      {caps && !error && (
        <p className="mt-1.5 text-caption text-partly" role="status">
          {t("auth.capsLock")}
        </p>
      )}
      {below}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-overdue">
          {error}
        </p>
      ) : hint && !below ? (
        <p id={`${id}-hint`} className="mt-1.5 text-caption text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
