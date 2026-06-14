import type { QuestSummaryView } from "../../domain/questRewards";
import { Button } from "../Button";
import { LootMaterialPreviewList } from "../LootMaterialRow";

/** Shared quest reward summary body (live summary or calendar history). */
export function QuestSummaryContent({
  summary,
  onConfirm,
  confirmLabel = "OK",
}: {
  summary: QuestSummaryView;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  const hasInvestigation = summary.perHunterInvestigation.some(
    (h) => Object.keys(h.materials).length > 0 || h.potions > 0,
  );
  const hasRolledLoot = summary.perHunterLoot.some((h) =>
    Object.values(h.quantities).some((q) => (q ?? 0) > 0),
  );
  const hasAggregate =
    Object.keys(summary.aggregatedInvestigation).length > 0 ||
    summary.totalPotions > 0;
  const showInvestigationSection =
    hasInvestigation &&
    (summary.keptInvestigation || summary.showInvestigationLog);

  return (
    <div className="flex flex-col gap-4">
      {summary.outcome?.result === "failure" && !summary.keptInvestigation && (
        <div className="paper-card p-4 text-center text-sm text-ink-soft">
          {summary.outcome.keepInvestigationLoot === false && hasInvestigation ? (
            <p>Investigation loot was left behind.</p>
          ) : (
            <p>Nothing gained from this hunt.</p>
          )}
        </div>
      )}

      {showInvestigationSection && (
        <div className="paper-card p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-accent">
            Investigation loot
          </p>
          <p className="mb-3 text-[11px] text-ink-soft">
            {summary.keptInvestigation
              ? "Logged per hunter; each hunter receives the full party pile."
              : "Gathered during investigation."}
          </p>
          <div className="flex flex-col gap-3">
            {summary.perHunterInvestigation.map((h) => {
              const hasItems =
                Object.keys(h.materials).length > 0 || h.potions > 0;
              if (!hasItems) return null;
              return (
                <div key={h.hunterId}>
                  <p className="mb-1 text-sm font-semibold">{h.name}</p>
                  {Object.keys(h.materials).length > 0 && (
                    <LootMaterialPreviewList
                      quantities={h.materials}
                      readOnly
                      compact
                    />
                  )}
                  {h.potions > 0 && (
                    <p className="mt-1 text-sm text-ink-soft">
                      +{h.potions} potion{h.potions > 1 ? "s" : ""} logged
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {summary.keptInvestigation && hasAggregate && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Each hunter received
              </p>
              {Object.keys(summary.aggregatedInvestigation).length > 0 && (
                <LootMaterialPreviewList
                  quantities={summary.aggregatedInvestigation}
                  readOnly
                  compact
                />
              )}
              {summary.totalPotions > 0 && (
                <p className="mt-2 text-sm">
                  +{summary.totalPotions} potion
                  {summary.totalPotions > 1 ? "s" : ""} → party stockpile
                </p>
              )}
            </div>
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

      {onConfirm && (
        <Button onClick={onConfirm} className="w-full py-3 text-sm font-bold">
          {confirmLabel}
        </Button>
      )}
    </div>
  );
}
