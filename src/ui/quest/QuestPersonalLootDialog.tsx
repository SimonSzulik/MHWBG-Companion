import type { PersonalLootSummary } from "../../domain/questRewards";
import { Button } from "../Button";
import { LootMaterialPreviewList } from "../LootMaterialRow";

/** Per-hunter reward popup after confirming quest loot. */
export function QuestPersonalLootDialog({
  hunterName,
  summary,
  onConfirm,
}: {
  hunterName: string;
  summary: PersonalLootSummary;
  onConfirm: () => void;
}) {
  const hasMaterials = Object.keys(summary.materials).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="paper-card w-full max-w-sm p-5">
        <p className="font-display text-xl">Rewards secured</p>
        <p className="mt-1 text-sm text-ink-soft">
          {hunterName}&apos;s haul from this quest
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {hasMaterials ? (
            <LootMaterialPreviewList
              quantities={summary.materials}
              readOnly
              compact
            />
          ) : (
            <p className="text-sm text-ink-soft">No materials this time.</p>
          )}

          {summary.potionsToParty > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-paper-2 px-3 py-2 text-sm">
              <img
                src="/icons/potion.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
              <span>
                <strong>×{summary.potionsToParty}</strong> potions added to party
                stockpile
              </span>
            </div>
          )}
        </div>

        <Button onClick={onConfirm} className="mt-5 w-full py-3 text-sm font-bold">
          OK
        </Button>
      </div>
    </div>
  );
}
