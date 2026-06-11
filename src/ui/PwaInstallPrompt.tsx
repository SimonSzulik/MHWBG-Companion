import { Button } from "./Button";

type Props = {
  iosMode: boolean;
  onInstall: () => void;
  onClose: () => void;
};

/** Mobile install helper shown when the app is not yet installed. */
export function PwaInstallPrompt({ iosMode, onInstall, onClose }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-4">
      <section className="paper-card pointer-events-auto p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl leading-tight">Install as app</p>
            {iosMode ? (
              <p className="mt-1 text-sm text-ink-soft">
                Open Share and tap “Add to Home Screen” to launch this app like
                a native app.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                Install the app for faster access and a full-screen experience.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss install prompt"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-sm active:translate-y-px"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onClose}
            className="bg-card px-3 py-2 text-sm font-semibold"
          >
            Later
          </Button>
          {!iosMode && (
            <Button
              rounded="lg"
              onClick={onInstall}
              className="px-3 py-2 text-sm font-semibold"
            >
              Install
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
