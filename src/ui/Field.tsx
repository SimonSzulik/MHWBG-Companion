import type { InputHTMLAttributes } from "react";

/**
 * Labelled text input — the recurring "uppercase caption + bordered input"
 * block used across the auth and onboarding screens. Standard input props
 * (value, onChange, type, placeholder, maxLength, …) are forwarded.
 */
export function Field({
  label,
  hint,
  className = "",
  ...input
}: {
  label: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm">
      <span className="text-xs uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        className={`mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none ${className}`}
        {...input}
      />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}
