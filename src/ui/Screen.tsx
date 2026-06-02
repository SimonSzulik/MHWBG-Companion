import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Standard drill-in screen frame: a back chevron + title header, then
 * scrollable content. Matches the mockups' "Inventory / Forge (drill-in)".
 */
export function Screen({
  title,
  subtitle,
  back = true,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-x-clip">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-paper/90 px-4 pb-3 pt-4 backdrop-blur">
        {back && (
          <button
            type="button"
            onClick={() => nav(-1)}
            aria-label="Zurück"
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
      <main className="flex-1 overflow-x-clip px-4 pb-24 pt-1">{children}</main>
    </div>
  );
}
