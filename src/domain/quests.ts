import { MAX_QUEST_COMPLETIONS, quests, type QuestDef } from "../data/quests";

export function questById(questId: string): QuestDef | undefined {
  return quests.find((q) => q.id === questId);
}

/** Max completions: 1★ once (success only); 2★+ up to 4 (success or failure). */
export function maxCompletionsForQuest(quest: QuestDef): number {
  return quest.stars === "one-star" ? 1 : MAX_QUEST_COMPLETIONS;
}

export function isQuestFullyCompleted(
  quest: QuestDef,
  count: number,
): boolean {
  return count >= maxCompletionsForQuest(quest);
}

export function canIncrementQuestCompletion(
  quest: QuestDef,
  currentCount: number,
): boolean {
  return currentCount < maxCompletionsForQuest(quest);
}

export function formatQuestCompletionCount(
  quest: QuestDef,
  count: number,
): string {
  const max = maxCompletionsForQuest(quest);
  return `${Math.min(count, max)}/${max}`;
}

export function canStartQuest(
  quest: QuestDef,
  completions: Record<string, number>,
  hasActiveQuest: boolean,
): boolean {
  if (hasActiveQuest) return false;
  const count = completions[quest.id] ?? 0;
  return !isQuestFullyCompleted(quest, count);
}

/** 2★+ failures consume one attempt; 1★ failures do not. */
export function shouldIncrementOnFailure(quest: QuestDef): boolean {
  return quest.stars !== "one-star";
}
