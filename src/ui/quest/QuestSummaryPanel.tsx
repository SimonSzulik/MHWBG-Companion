import { buildQuestSummary } from "../../domain/questRewards";
import type { ActiveQuest, Hunter } from "../../domain/types";
import { QuestSummaryContent } from "./QuestSummaryContent";

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
