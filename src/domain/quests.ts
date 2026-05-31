import { MAX_QUEST_COMPLETIONS, quests, type QuestDef } from "../data/quests";

export function questById(questId: string): QuestDef | undefined {
  return quests.find((q) => q.id === questId);
}

export function canStartQuest(
  quest: QuestDef,
  completions: Record<string, number>,
  hasActiveQuest: boolean,
): boolean {
  if (hasActiveQuest) return false;
  const count = completions[quest.id] ?? 0;
  if (quest.stars === "one-star" && count >= 1) return false;
  if (count >= MAX_QUEST_COMPLETIONS) return false;
  return true;
}

export function shouldIncrementOnFailure(quest: QuestDef): boolean {
  return quest.stars !== "one-star";
}
