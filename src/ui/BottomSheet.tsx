import type { ReactNode } from "react";
import { useBodyScrollLock } from "./forge/ForgeTreeCanvas";

/**
 * Bottom-anchored modal sheet: dimmed backdrop that dismisses on tap, with a
 * rounded panel slid up from the bottom. The panel's surface colour / height
 * stay with the caller via `className` (e.g. dark inventory sheet vs. paper
 * forge sheet); the overlay, dismiss target and body-scroll lock live here.
 */
export function BottomSheet({
  onClose,
  className = "",
  children,
}: {
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40">
      <button
        type="button"
        className="min-h-0 flex-1"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`rounded-t-2xl border-t border-line-strong px-4 pb-8 pt-4 shadow-lg ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
