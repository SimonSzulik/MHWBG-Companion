import type { ReactNode } from "react";
import { useSyncStatus } from "../lib/sync/useSync";

/** Blocks the app shell when offline or sync is not live. */
export function OnlineGate({ children }: { children: ReactNode }) {
  const { status, detail } = useSyncStatus();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  if (offline) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl">Offline</p>
        <p className="mt-2 text-sm text-ink-soft">
          Eine Internetverbindung ist erforderlich, um die Kampagne zu spielen.
        </p>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl">Verbinde…</p>
        <p className="mt-2 text-sm text-ink-soft">Synchronisiere mit der Kampagne.</p>
      </div>
    );
  }

  if (status === "error" || status === "off") {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl">Sync-Fehler</p>
        <p className="mt-2 text-sm text-ink-soft">
          {detail ?? "Verbindung zur Kampagne fehlgeschlagen."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-[1.5px] border-line-strong bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Neu laden
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
