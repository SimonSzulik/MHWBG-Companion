/**
 * Main quests for Ancient Forest — from reDBo0n/mhwbg-comp items.json.
 * Grouped by monster, star tier (* level).
 * 1★: max 1 success (failures do not count). 2★+: max 4 attempts (success or failure).
 */

export type QuestStars = "one-star" | "two-star" | "three-star" | "four-star";

export interface QuestDef {
  id: string;
  name: string;
  monsterId: string;
  stars: QuestStars;
  /** Monster icon stem, e.g. "jagras". */
  icon: string;
  /** Quest card colour tier, e.g. "white-head". */
  type: string;
}

/** Display order for monster sections in the quest picker. */
export const QUEST_MONSTERS: { id: string; name: string; icon: string }[] = [
  { id: "jagras", name: "Great Jagras", icon: "jagras" },
  { id: "tobi-kadachi", name: "Tobi-Kadachi", icon: "tobi-kadachi" },
  { id: "anjanath", name: "Anjanath", icon: "anjanath" },
  { id: "rathalos", name: "Rathalos", icon: "rathalos" },
  { id: "azure-rathalos", name: "Azure Rathalos", icon: "azure-rathalos" },
];

export const STAR_ORDER: QuestStars[] = [
  "one-star",
  "two-star",
  "three-star",
  "four-star",
];

export const MAX_QUEST_COMPLETIONS = 4;

export const quests: QuestDef[] = [
  {
    id: "great-jagras-1",
    name: "Great Jagras",
    monsterId: "jagras",
    stars: "one-star",
    icon: "jagras",
    type: "white-head",
  },
  {
    id: "great-jagras-2",
    name: "Great Jagras",
    monsterId: "jagras",
    stars: "two-star",
    icon: "jagras",
    type: "white-head",
  },
  {
    id: "great-jagras-3",
    name: "Great Jagras",
    monsterId: "jagras",
    stars: "three-star",
    icon: "jagras",
    type: "white-head",
  },
  {
    id: "tobi-kadachi-1",
    name: "Tobi-Kadachi",
    monsterId: "tobi-kadachi",
    stars: "one-star",
    icon: "tobi-kadachi",
    type: "yellow-head",
  },
  {
    id: "tobi-kadachi-2",
    name: "Tobi-Kadachi",
    monsterId: "tobi-kadachi",
    stars: "two-star",
    icon: "tobi-kadachi",
    type: "yellow-head",
  },
  {
    id: "tobi-kadachi-3",
    name: "Tobi-Kadachi",
    monsterId: "tobi-kadachi",
    stars: "three-star",
    icon: "tobi-kadachi",
    type: "yellow-head",
  },
  {
    id: "anjanath-1",
    name: "Anjanath",
    monsterId: "anjanath",
    stars: "one-star",
    icon: "anjanath",
    type: "green-head",
  },
  {
    id: "anjanath-2",
    name: "Anjanath",
    monsterId: "anjanath",
    stars: "two-star",
    icon: "anjanath",
    type: "green-head",
  },
  {
    id: "anjanath-3",
    name: "Anjanath",
    monsterId: "anjanath",
    stars: "three-star",
    icon: "anjanath",
    type: "green-head",
  },
  {
    id: "rathalos-1",
    name: "Rathalos",
    monsterId: "rathalos",
    stars: "one-star",
    icon: "rathalos",
    type: "purple-head",
  },
  {
    id: "rathalos-2",
    name: "Rathalos",
    monsterId: "rathalos",
    stars: "two-star",
    icon: "rathalos",
    type: "purple-head",
  },
  {
    id: "rathalos-4",
    name: "Rathalos",
    monsterId: "rathalos",
    stars: "four-star",
    icon: "rathalos",
    type: "purple-head",
  },
  {
    id: "azure-rathalos-1",
    name: "Azure Rathalos",
    monsterId: "azure-rathalos",
    stars: "one-star",
    icon: "azure-rathalos",
    type: "purple-head",
  },
  {
    id: "azure-rathalos-2",
    name: "Azure Rathalos",
    monsterId: "azure-rathalos",
    stars: "two-star",
    icon: "azure-rathalos",
    type: "purple-head",
  },
  {
    id: "azure-rathalos-4",
    name: "Azure Rathalos",
    monsterId: "azure-rathalos",
    stars: "four-star",
    icon: "azure-rathalos",
    type: "purple-head",
  },
];

export function questsForMonster(monsterId: string): QuestDef[] {
  return quests.filter((q) => q.monsterId === monsterId);
}
