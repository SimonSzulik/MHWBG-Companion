import {
  MAX_QUEST_COMPLETIONS,
  quests,
  type QuestCategory,
  type QuestDef,
  type QuestStars,
} from "../data/quests";

const STAR_RANK: Record<QuestStars, number> = {
  "one-star": 1,
  "two-star": 2,
  "three-star": 3,
  "four-star": 4,
};

export function questById(questId: string): QuestDef | undefined {
  return quests.find((q) => q.id === questId);
}

export function questCategory(quest: QuestDef): QuestCategory {
  switch (quest.stars) {
    case "one-star":
      return "assigned";
    case "four-star":
      return "tempered";
    default:
      return "investigation";
  }
}

function lowerTierQuestsForMonster(
  quest: QuestDef,
  monsterQuests: QuestDef[],
): QuestDef[] {
  const rank = STAR_RANK[quest.stars];
  return monsterQuests.filter((q) => STAR_RANK[q.stars] < rank);
}

/** True when all lower star-tier quests for this monster are fully completed. */
export function isQuestTierUnlocked(
  quest: QuestDef,
  completions: Record<string, number>,
  monsterQuests: QuestDef[],
): boolean {
  return lowerTierQuestsForMonster(quest, monsterQuests).every((q) =>
    isQuestFullyCompleted(q, completions[q.id] ?? 0),
  );
}

export function questTierLockReason(
  quest: QuestDef,
  completions: Record<string, number>,
  monsterQuests: QuestDef[],
): string | undefined {
  const incomplete = lowerTierQuestsForMonster(quest, monsterQuests).filter(
    (q) => !isQuestFullyCompleted(q, completions[q.id] ?? 0),
  );
  if (incomplete.length === 0) return undefined;
  const tiers = [
    ...new Set(incomplete.map((q) => starLabel(q.stars))),
  ].join(" und ");
  return `Zuerst ${tiers} abschließen`;
}

/** The campaign's mandatory first quest — the 1★ Great Jagras. */
export const FIRST_QUEST_ID = "great-jagras-1";

/** Whether the mandatory first quest (1★ Great Jagras) has been completed. */
export function isFirstQuestCleared(
  completions: Record<string, number>,
): boolean {
  const first = questById(FIRST_QUEST_ID);
  return first
    ? isQuestFullyCompleted(first, completions[FIRST_QUEST_ID] ?? 0)
    : true;
}

/**
 * Campaign gate: only the 1★ Great Jagras is available at the start; the
 * remaining assigned (1★) quests stay locked until it is cleared. Higher
 * tiers are gated transitively via their monster's own 1★ assignment.
 */
function isCampaignUnlocked(
  quest: QuestDef,
  completions: Record<string, number>,
): boolean {
  if (quest.id === FIRST_QUEST_ID) return true;
  if (questCategory(quest) === "assigned") {
    return isFirstQuestCleared(completions);
  }
  return true;
}

/** Full unlock check: campaign gate (Great Jagras first) + star-tier order. */
export function isQuestUnlocked(
  quest: QuestDef,
  completions: Record<string, number>,
  monsterQuests: QuestDef[],
): boolean {
  return (
    isCampaignUnlocked(quest, completions) &&
    isQuestTierUnlocked(quest, completions, monsterQuests)
  );
}

/** Reason a quest is locked — campaign gate first, then star-tier order. */
export function questLockReason(
  quest: QuestDef,
  completions: Record<string, number>,
  monsterQuests: QuestDef[],
): string | undefined {
  if (!isCampaignUnlocked(quest, completions)) {
    return "Zuerst den 1★ Großen Jagras erlegen";
  }
  return questTierLockReason(quest, completions, monsterQuests);
}

/** Short star-tier label, e.g. "3★". */
export function starLabel(stars: QuestStars): string {
  switch (stars) {
    case "one-star":
      return "1★";
    case "two-star":
      return "2★";
    case "three-star":
      return "3★";
    case "four-star":
      return "4★";
  }
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
  monsterQuests: QuestDef[],
  pendingHandlerQuestId?: string | null,
): boolean {
  if (hasActiveQuest) return false;
  if (pendingHandlerQuestId && pendingHandlerQuestId !== quest.id) {
    return false;
  }
  if (pendingHandlerQuestId === quest.id) return true;
  if (!isQuestUnlocked(quest, completions, monsterQuests)) return false;
  const count = completions[quest.id] ?? 0;
  return !isQuestFullyCompleted(quest, count);
}

/** 2★+ failures consume one attempt; 1★ failures do not. */
export function shouldIncrementOnFailure(quest: QuestDef): boolean {
  return quest.stars !== "one-star";
}
