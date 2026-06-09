import { Button } from "./Button";

/** Centered confirm/cancel modal dialog. */
export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="paper-card w-full max-w-sm p-5">
        <p className="font-display text-xl">{title}</p>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-semibold"
          >
            Abbrechen
          </Button>
          <Button
            rounded="lg"
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-semibold"
          >
            Ja
          </Button>
        </div>
      </div>
    </div>
  );
}
