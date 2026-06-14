import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ScreenBackground } from "./ScreenBackground";

/**
 * Standard drill-in screen frame: a back chevron + title header, then
 * scrollable content. Matches the mockups' "Inventory / Forge (drill-in)".
 * Pass `background` to show a faded artwork layer behind the whole screen.
 */
export function Screen({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  background,
  backgroundFallback,
  hideHeader = false,
  headerTransparent = false,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** Override the default `history.back()` behaviour of the back chevron. */
  onBack?: () => void;
  right?: ReactNode;
  background?: string;
  backgroundFallback?: string;
  hideHeader?: boolean;
  /** Drop the opaque header bar so a background image shows through. */
  headerTransparent?: boolean;
  children: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-x-clip">
      {background && (
        <ScreenBackground src={background} fallback={backgroundFallback} />
      )}
      {!hideHeader && (
        <header
          className={`sticky top-0 z-10 flex items-center gap-3 px-4 pb-3 pt-4 ${
            headerTransparent ? "" : "bg-paper/90 backdrop-blur"
          }`}
        >
          {back && (
            <button
              type="button"
              onClick={() => (onBack ? onBack() : nav(-1))}
              aria-label="Back"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-card text-lg active:translate-y-px"
            >
              ‹
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-2xl leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-ink-soft">{subtitle}</p>
            )}
          </div>
          {right}
        </header>
      )}
      <main
        className={`flex-1 overflow-x-clip px-4 pb-24 ${
          hideHeader ? "pt-[calc(env(safe-area-inset-top)+0.75rem)]" : "pt-1"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
