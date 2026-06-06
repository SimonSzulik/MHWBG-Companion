import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-accent text-white",
  secondary: "",
};

/**
 * Shared action button: the recurring outlined pill with a tap nudge.
 *
 * The invariant frame (border, radius, active/disabled states) lives here;
 * layout (width, padding, text size, font weight) and one-off background
 * colours stay inline via `className` so call sites read like the originals.
 */
export function Button({
  variant = "primary",
  rounded = "xl",
  className = "",
  type,
  ...rest
}: {
  variant?: Variant;
  rounded?: "lg" | "xl";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const radius = rounded === "lg" ? "rounded-lg" : "rounded-xl";
  return (
    <button
      type={type ?? "button"}
      className={`${radius} border-[1.5px] border-line-strong active:translate-y-px disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}
