/**
 * Main quests for Ancient Forest — from reDBo0n/mhwbg-comp items.json.
 * Grouped by monster, star tier (* level).
 * 1★: max 1 success (failures do not count). 2★+: max 4 attempts (success or failure).
 */

import type { QuestStars } from "../domain/types";

export type { QuestStars };

/** Assigned (1★), investigation (2★), or tempered investigation (3★–5★). */
export type QuestCategory = "assigned" | "investigation" | "tempered";

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
  // Wildspire Waste. Barroth leads, because the rulebook (Ancient Forest p.38)
  // lets a combined campaign open on either Great Jagras or Barroth.
  { id: "barroth", name: "Barroth", icon: "barroth" },
  { id: "pukei-pukei", name: "Pukei-Pukei", icon: "pukei-pukei" },
  { id: "jyuratodus", name: "Jyuratodus", icon: "jyuratodus" },
  { id: "diablos", name: "Diablos", icon: "diablos" },
  { id: "black-diablos", name: "Black Diablos", icon: "black-diablos" },
  // Single-monster expansions.
  { id: "kulu-ya-ku", name: "Kulu-Ya-Ku", icon: "kulu-ya-ku" },
  { id: "kushala-daora", name: "Kushala Daora", icon: "kushala-daora" },
  { id: "nergigante", name: "Nergigante", icon: "nergigante" },
  { id: "teostra", name: "Teostra", icon: "teostra" },
];

export const STAR_ORDER: QuestStars[] = [
  "one-star",
  "two-star",
  "three-star",
  "four-star",
  "five-star",
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

  // ===== Wildspire Waste =====
  // Quest ids, star tiers and categories transcribed from the printed quest
  // books via Elvaron/MHW-BG-QuestCards (CC0). See
  // docs/research/mhwbg-content-dossier.md.
  // `type` (quest-card colour) is NOT in that dataset and is inferred from each
  // monster's position in the box — it is cosmetic only. Listed in the
  // missing-data report for confirmation against the physical cards.
  {
    id: "barroth-1",
    name: "Barroth",
    monsterId: "barroth",
    stars: "one-star",
    icon: "barroth",
    type: "white-head",
  },
  {
    id: "barroth-2",
    name: "Barroth",
    monsterId: "barroth",
    stars: "two-star",
    icon: "barroth",
    type: "white-head",
  },
  {
    id: "barroth-3",
    name: "Barroth",
    monsterId: "barroth",
    stars: "three-star",
    icon: "barroth",
    type: "white-head",
  },
  {
    id: "pukei-pukei-1",
    name: "Pukei-Pukei",
    monsterId: "pukei-pukei",
    stars: "one-star",
    icon: "pukei-pukei",
    type: "yellow-head",
  },
  {
    id: "pukei-pukei-2",
    name: "Pukei-Pukei",
    monsterId: "pukei-pukei",
    stars: "two-star",
    icon: "pukei-pukei",
    type: "yellow-head",
  },
  {
    id: "pukei-pukei-3",
    name: "Pukei-Pukei",
    monsterId: "pukei-pukei",
    stars: "three-star",
    icon: "pukei-pukei",
    type: "yellow-head",
  },
  {
    id: "jyuratodus-1",
    name: "Jyuratodus",
    monsterId: "jyuratodus",
    stars: "one-star",
    icon: "jyuratodus",
    type: "green-head",
  },
  {
    id: "jyuratodus-2",
    name: "Jyuratodus",
    monsterId: "jyuratodus",
    stars: "two-star",
    icon: "jyuratodus",
    type: "green-head",
  },
  {
    id: "jyuratodus-3",
    name: "Jyuratodus",
    monsterId: "jyuratodus",
    stars: "three-star",
    icon: "jyuratodus",
    type: "green-head",
  },
  {
    id: "diablos-1",
    name: "Diablos",
    monsterId: "diablos",
    stars: "one-star",
    icon: "diablos",
    type: "purple-head",
  },
  {
    id: "diablos-2",
    name: "Diablos",
    monsterId: "diablos",
    stars: "two-star",
    icon: "diablos",
    type: "purple-head",
  },
  {
    id: "diablos-4",
    name: "Diablos",
    monsterId: "diablos",
    stars: "four-star",
    icon: "diablos",
    type: "purple-head",
  },
  {
    id: "black-diablos-1",
    name: "Black Diablos",
    monsterId: "black-diablos",
    stars: "one-star",
    icon: "black-diablos",
    type: "purple-head",
  },
  {
    id: "black-diablos-2",
    name: "Black Diablos",
    monsterId: "black-diablos",
    stars: "two-star",
    icon: "black-diablos",
    type: "purple-head",
  },
  {
    id: "black-diablos-4",
    name: "Black Diablos",
    monsterId: "black-diablos",
    stars: "four-star",
    icon: "black-diablos",
    type: "purple-head",
  },

  // ===== Single-monster expansions =====
  // Same source as the Wildspire block. The elder dragons top out at 5★, which
  // is why QuestStars has a five-star tier.
  {
    id: "kulu-ya-ku-1",
    name: "Kulu-Ya-Ku",
    monsterId: "kulu-ya-ku",
    stars: "one-star",
    icon: "kulu-ya-ku",
    type: "white-head",
  },
  {
    id: "kulu-ya-ku-2",
    name: "Kulu-Ya-Ku",
    monsterId: "kulu-ya-ku",
    stars: "two-star",
    icon: "kulu-ya-ku",
    type: "white-head",
  },
  {
    id: "kulu-ya-ku-3",
    name: "Kulu-Ya-Ku",
    monsterId: "kulu-ya-ku",
    stars: "three-star",
    icon: "kulu-ya-ku",
    type: "white-head",
  },
  {
    id: "kushala-daora-1",
    name: "Kushala Daora",
    monsterId: "kushala-daora",
    stars: "one-star",
    icon: "kushala-daora",
    type: "purple-head",
  },
  {
    id: "kushala-daora-2",
    name: "Kushala Daora",
    monsterId: "kushala-daora",
    stars: "two-star",
    icon: "kushala-daora",
    type: "purple-head",
  },
  {
    id: "kushala-daora-5",
    name: "Kushala Daora",
    monsterId: "kushala-daora",
    stars: "five-star",
    icon: "kushala-daora",
    type: "purple-head",
  },
  {
    id: "nergigante-1",
    name: "Nergigante",
    monsterId: "nergigante",
    stars: "one-star",
    icon: "nergigante",
    type: "purple-head",
  },
  {
    id: "nergigante-2",
    name: "Nergigante",
    monsterId: "nergigante",
    stars: "two-star",
    icon: "nergigante",
    type: "purple-head",
  },
  {
    id: "nergigante-5",
    name: "Nergigante",
    monsterId: "nergigante",
    stars: "five-star",
    icon: "nergigante",
    type: "purple-head",
  },
  {
    id: "teostra-1",
    name: "Teostra",
    monsterId: "teostra",
    stars: "one-star",
    icon: "teostra",
    type: "purple-head",
  },
  {
    id: "teostra-2",
    name: "Teostra",
    monsterId: "teostra",
    stars: "two-star",
    icon: "teostra",
    type: "purple-head",
  },
  {
    id: "teostra-5",
    name: "Teostra",
    monsterId: "teostra",
    stars: "five-star",
    icon: "teostra",
    type: "purple-head",
  },
];

export function questsForMonster(monsterId: string): QuestDef[] {
  return quests.filter((q) => q.monsterId === monsterId);
}
