import type { QuestDef } from "../data/quests";
import type { Campaign } from "./types";

export type QuestResult = "success" | "failure";

function shouldAdvanceDay(quest: QuestDef, result: QuestResult): boolean {
  if (result === "success") return true;
  return quest.stars !== "one-star";
}

/** Record quest on current calendar day and advance day when rules allow. */
export function recordQuestOnCalendar(
  campaign: Campaign,
  quest: QuestDef,
  result: QuestResult,
): Campaign {
  if (result === "failure" && quest.stars === "one-star") return campaign;

  const entry = {
    monsterId: quest.monsterId,
    stars: quest.stars,
    result,
  } as const;

  const nextDay = shouldAdvanceDay(quest, result)
    ? Math.min(campaign.day + 1, campaign.maxDay)
    : campaign.day;

  return {
    ...campaign,
    dayLog: { ...campaign.dayLog, [campaign.day]: entry },
    day: nextDay,
  };
}
