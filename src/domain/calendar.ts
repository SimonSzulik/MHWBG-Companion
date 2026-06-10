import type { QuestDef } from "../data/quests";
import type { Campaign } from "./types";

export type QuestResult = "success" | "failure";

function shouldAdvanceDay(
  quest: QuestDef,
  result: QuestResult,
  keepInvestigationLoot?: boolean,
): boolean {
  if (result === "success") return true;
  if (quest.stars === "one-star") return keepInvestigationLoot === true;
  return true;
}

/** Record quest on current calendar day and advance day when rules allow. */
export function recordQuestOnCalendar(
  campaign: Campaign,
  quest: QuestDef,
  result: QuestResult,
  handler = false,
  opts?: { keepInvestigationLoot?: boolean },
): Campaign {
  const keepLoot = opts?.keepInvestigationLoot;
  if (result === "failure" && quest.stars === "one-star" && !keepLoot) {
    return campaign;
  }

  const entry = {
    kind: "quest" as const,
    monsterId: quest.monsterId,
    stars: quest.stars,
    result,
    ...(handler ? { handler: true } : {}),
  };

  const nextDay = shouldAdvanceDay(quest, result, keepLoot)
    ? Math.min(campaign.day + 1, campaign.maxDay)
    : campaign.day;

  return {
    ...campaign,
    dayLog: { ...campaign.dayLog, [campaign.day]: entry },
    day: nextDay,
  };
}

/** Record downtime on current calendar day and advance by one day. */
export function recordDowntimeOnCalendar(campaign: Campaign): Campaign {
  return {
    ...campaign,
    dayLog: { ...campaign.dayLog, [campaign.day]: { kind: "downtime" } },
    day: Math.min(campaign.day + 1, campaign.maxDay),
  };
}
