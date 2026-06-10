import { buildQuestSummary, type QuestSummaryView } from "../../domain/questRewards";
import type { ActiveQuest, Hunter } from "../../domain/types";
import { Button } from "../Button";
import { LootMaterialPreviewList } from "../LootMaterialRow";

/** End-of-quest reward summary before returning to Camp. */
export function QuestSummaryPanel({
  activeQuest,
  hunters,
  onConfirm,
}: {
  activeQuest: ActiveQuest;
  hunters: Hunter[];
  onConfirm: () => void;
}) {
  const summary = buildQuestSummary(activeQuest, hunters);
  return <QuestSummaryContent summary={summary} onConfirm={onConfirm} />;
}

function QuestSummaryContent({
  summary,
  onConfirm,
}: {
  summary: QuestSummaryView;
  onConfirm: () => void;
}) {
  const hasInvestigation =
    Object.keys(summary.investigationLoot).length > 0 ||
    summary.investigationPotions > 0;
  const hasRolledLoot = summary.perHunterLoot.some(
    (h) => Object.keys(h.quantities).some((id) => (h.quantities[id] ?? 0) > 0),
  );

  return (
    <div className="flex flex-col gap-4">
      {summary.outcome?.result === "failure" && !summary.keptInvestigation && (
        <div className="paper-card p-4 text-center text-sm text-ink-soft">
          {summary.outcome.keepInvestigationLoot === false &&
          hasInvestigation ? (
            <p>Investigation loot was left behind.</p>
          ) : (
            <p>Nothing gained from this hunt.</p>
          )}
        </div>
      )}

      {summary.keptInvestigation && hasInvestigation && (
        <div className="paper-card p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-accent">
            Investigation loot
          </p>
          <p className="mb-3 text-[11px] text-ink-soft">
            Each hunter receives these materials.
          </p>
          {Object.keys(summary.investigationLoot).length > 0 && (
            <LootMaterialPreviewList
              quantities={summary.investigationLoot}
              readOnly
              compact
            />
          )}
          {summary.investigationPotions > 0 && (
            <p className="mt-2 text-sm">
              +{summary.investigationPotions} potion
              {summary.investigationPotions > 1 ? "s" : ""} → party stockpile
            </p>
          )}
        </div>
      )}

      {summary.showRolledLoot && hasRolledLoot && (
        <div className="paper-card p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-accent">
            Quest loot
          </p>
          <div className="flex flex-col gap-3">
            {summary.perHunterLoot.map((h) => {
              const hasItems = Object.values(h.quantities).some((q) => q > 0);
              if (!hasItems) return null;
              return (
                <div key={h.hunterId}>
                  <p className="mb-1 text-sm font-semibold">{h.name}</p>
                  <LootMaterialPreviewList
                    quantities={h.quantities}
                    readOnly
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary.outcome?.result === "success" &&
        !hasInvestigation &&
        !hasRolledLoot && (
          <div className="paper-card p-4 text-center text-sm text-ink-soft">
            Quest completed.
          </div>
        )}

      <Button onClick={onConfirm} className="w-full py-3 text-sm font-bold">
        OK
      </Button>
    </div>
  );
}
