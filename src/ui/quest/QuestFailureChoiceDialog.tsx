import { Button } from "../Button";

/** 1★ assigned quest failure: keep investigation loot or discard it. */
export function QuestFailureChoiceDialog({
  onKeepLoot,
  onDiscardLoot,
  onCancel,
}: {
  onKeepLoot: () => void;
  onDiscardLoot: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="paper-card w-full max-w-sm p-5">
        <p className="font-display text-xl">Quest failed</p>
        <p className="mt-2 text-sm text-ink-soft">
          Keep the items you gathered while investigating?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            rounded="lg"
            onClick={onKeepLoot}
            className="w-full py-2 text-sm font-semibold"
          >
            Keep gathered loot
          </Button>
          <p className="text-center text-[11px] text-ink-soft">
            Uses one campaign day
          </p>
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onDiscardLoot}
            className="w-full py-2 text-sm font-semibold"
          >
            Leave loot behind
          </Button>
          <p className="text-center text-[11px] text-ink-soft">
            No day lost
          </p>
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onCancel}
            className="mt-1 w-full py-2 text-sm font-semibold"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
