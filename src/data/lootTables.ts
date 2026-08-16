import type { MonsterPartId } from "../domain/types";

export interface LootRow {
  roll: number;
  materialId: string;
  partBreak?: MonsterPartId;
}

export const BREAKABLE_PARTS: Record<string, MonsterPartId[]> = {
  jagras: ["claws", "head", "body"],
  "tobi-kadachi": ["head", "tail", "back"],
  anjanath: ["head", "tail"],
  rathalos: ["back", "head", "wings"],
  "azure-rathalos": ["wings", "back", "tail", "head"],
  // Wildspire Waste — from the physiology data in the CC0 quest-card set.
  // That source also lists a "legs" part for Jyuratodus, Diablos and Black
  // Diablos, which `MonsterPartId` has no equivalent for, so it is omitted.
  barroth: ["head", "body", "claws", "tail"],
  "pukei-pukei": ["head", "tail", "claws"],
  jyuratodus: ["head", "tail"],
  diablos: ["head", "tail", "claws"],
  "black-diablos": ["head", "tail", "claws"],
};

export const LOOT_TABLES: Record<string, LootRow[]> = {
  jagras: [
    { roll: 1, materialId: "monster-bone-small" },
    { roll: 2, materialId: "great-jagras-claw" },
    { roll: 3, materialId: "great-jagras-hide" },
    { roll: 4, materialId: "great-jagras-scale" },
    { roll: 5, materialId: "great-jagras-mane" },
    { roll: 6, materialId: "great-jagras-claw", partBreak: "claws" },
    { roll: 7, materialId: "sharp-claw" },
    { roll: 8, materialId: "piercing-claw" },
    { roll: 9, materialId: "monster-bone-small" },
    { roll: 10, materialId: "great-jagras-hide", partBreak: "head" },
    { roll: 11, materialId: "great-jagras-scale" },
    { roll: 12, materialId: "great-jagras-mane", partBreak: "body" },
  ],
  "tobi-kadachi": [
    { roll: 1, materialId: "monster-bone-medium" },
    { roll: 2, materialId: "tobi-kadachi-pelt", partBreak: "head" },
    { roll: 3, materialId: "tobi-kadachi-scale" },
    { roll: 4, materialId: "electro-sac" },
    { roll: 5, materialId: "tobi-kadachi-electrode" },
    { roll: 6, materialId: "tobi-kadachi-membrane", partBreak: "tail" },
    { roll: 7, materialId: "monster-keenbone" },
    { roll: 8, materialId: "tobi-kadachi-claw" },
    { roll: 9, materialId: "monster-bone-medium" },
    { roll: 10, materialId: "thunder-sac" },
    { roll: 11, materialId: "monster-keenbone" },
    { roll: 12, materialId: "tobi-kadachi-electrode", partBreak: "back" },
  ],
  anjanath: [
    { roll: 1, materialId: "anjanath-scale", partBreak: "head" },
    { roll: 2, materialId: "anjanath-pelt" },
    { roll: 3, materialId: "anjanath-nosebone" },
    { roll: 4, materialId: "anjanath-tail", partBreak: "tail" },
    { roll: 5, materialId: "anjanath-fang", partBreak: "head" },
    { roll: 6, materialId: "monster-keenbone" },
    { roll: 7, materialId: "flame-sac" },
    { roll: 8, materialId: "monster-bone-large" },
    { roll: 9, materialId: "anjanath-pelt" },
    { roll: 10, materialId: "monster-bone-large" },
    { roll: 11, materialId: "flame-sac" },
    { roll: 12, materialId: "inferno-sac", partBreak: "head" },
  ],
  rathalos: [
    { roll: 1, materialId: "rathalos-wingtalon" },
    { roll: 2, materialId: "monster-bone-large" },
    { roll: 3, materialId: "rathalos-scale" },
    { roll: 4, materialId: "rathalos-webbing" },
    { roll: 5, materialId: "rathalos-tail" },
    { roll: 6, materialId: "rathalos-marrow", partBreak: "back" },
    { roll: 7, materialId: "rathalos-plate", partBreak: "head" },
    { roll: 8, materialId: "rathalos-wing", partBreak: "wings" },
    { roll: 9, materialId: "rathalos-carapace" },
    { roll: 10, materialId: "rathalos-shell" },
    { roll: 11, materialId: "rathalos-medulla" },
    { roll: 12, materialId: "inferno-sac", partBreak: "head" },
  ],
  "azure-rathalos": [
    { roll: 1, materialId: "azure-rathalos-wingtalon", partBreak: "wings" },
    { roll: 2, materialId: "monster-bone-large" },
    { roll: 3, materialId: "azure-rathalos-scale" },
    { roll: 4, materialId: "azure-rathalos-wing" },
    { roll: 5, materialId: "azure-rathalos-plate" },
    { roll: 6, materialId: "azure-rathalos-marrow", partBreak: "back" },
    { roll: 7, materialId: "azure-rathalos-tail", partBreak: "tail" },
    { roll: 8, materialId: "azure-rathalos-carapace" },
    { roll: 9, materialId: "azure-rathalos-wingtalon" },
    { roll: 10, materialId: "azure-rathalos-carapace" },
    { roll: 11, materialId: "azure-rathalos-tail" },
    { roll: 12, materialId: "inferno-sac", partBreak: "head" },
  ],

  // ===== Wildspire Waste =====
  // Rows transcribed from the reward tables in the CC0 quest-card set
  // (Elvaron/MHW-BG-QuestCards); see docs/research/mhwbg-content-dossier.md.
  // That source validates exactly against the Ancient Forest tables above.
  //
  // It records *that* a row is a break reward but not *which* part it belongs
  // to, and the Ancient Forest tables show the part is printed per row (Anjanath
  // repeats "head" three times), so it cannot be derived. `partBreak` is
  // therefore left off rather than guessed — those rows simply do not double
  // yet. Every affected roll is listed in docs/qa/missing-data.md.
  barroth: [
    { roll: 1, materialId: "monster-bone-small" },
    { roll: 2, materialId: "barroth-claw" },
    { roll: 3, materialId: "barroth-ridge" },
    { roll: 4, materialId: "barroth-shell" },
    { roll: 5, materialId: "barroth-carapace" },
    { roll: 6, materialId: "barroth-claw" },
    { roll: 7, materialId: "monster-bone-small" },
    { roll: 8, materialId: "barroth-claw" },
    { roll: 9, materialId: "barroth-carapace" },
    { roll: 10, materialId: "barroth-shell" },
    { roll: 11, materialId: "barroth-ridge" },
    { roll: 12, materialId: "barroth-claw" },
  ],
  "pukei-pukei": [
    { roll: 1, materialId: "monster-bone-medium" },
    { roll: 2, materialId: "pukei-pukei-wing" },
    { roll: 3, materialId: "pukei-pukei-scale" },
    { roll: 4, materialId: "pukei-pukei-quill" },
    { roll: 5, materialId: "pukei-pukei-carapace" },
    { roll: 6, materialId: "poison-sac" },
    { roll: 7, materialId: "pukei-pukei-tail" },
    { roll: 8, materialId: "toxin-sac" },
    { roll: 9, materialId: "pukei-pukei-wing" },
    { roll: 10, materialId: "pukei-pukei-scale" },
    { roll: 11, materialId: "pukei-pukei-carapace" },
    { roll: 12, materialId: "monster-bone-medium" },
  ],
  jyuratodus: [
    { roll: 1, materialId: "jyuratodus-fin" },
    { roll: 2, materialId: "aqua-sac" },
    { roll: 3, materialId: "jyuratodus-scale" },
    { roll: 4, materialId: "jyuratodus-shell" },
    { roll: 5, materialId: "monster-bone-large" },
    { roll: 6, materialId: "jyuratodus-carapace" },
    { roll: 7, materialId: "jyuratodus-fang" },
    { roll: 8, materialId: "jyuratodus-carapace" },
    { roll: 9, materialId: "gajau-scale" },
    { roll: 10, materialId: "jyuratodus-shell" },
    { roll: 11, materialId: "jyuratodus-scale" },
    { roll: 12, materialId: "jyuratodus-fin" },
  ],
  diablos: [
    { roll: 1, materialId: "diablos-shell" },
    { roll: 2, materialId: "diablos-carapace" },
    { roll: 3, materialId: "twisted-horn" },
    { roll: 4, materialId: "majestic-horn" },
    { roll: 5, materialId: "diablos-fang" },
    { roll: 6, materialId: "diablos-ridge" },
    { roll: 7, materialId: "blos-medulla" },
    { roll: 8, materialId: "diablos-carapace" },
    { roll: 9, materialId: "diablos-fang" },
    { roll: 10, materialId: "majestic-horn" },
    { roll: 11, materialId: "twisted-horn" },
    { roll: 12, materialId: "diablos-shell" },
  ],
  "black-diablos": [
    { roll: 1, materialId: "novacrystal" },
    { roll: 2, materialId: "black-diablos-carapace" },
    { roll: 3, materialId: "black-spiral-horn" },
    { roll: 4, materialId: "majestic-horn" },
    { roll: 5, materialId: "black-diablos-carapace" },
    { roll: 6, materialId: "black-diablos-ridge" },
    { roll: 7, materialId: "blos-medulla" },
    { roll: 8, materialId: "wyvern-gem" },
    { roll: 9, materialId: "novacrystal" },
    { roll: 10, materialId: "black-diablos-carapace" },
    { roll: 11, materialId: "majestic-horn" },
    { roll: 12, materialId: "black-spiral-horn" },
  ],
};

export function lootTableForMonster(monsterId: string): LootRow[] | undefined {
  return LOOT_TABLES[monsterId];
}

export const PART_LABELS: Record<MonsterPartId, string> = {
  head: "Head",
  tail: "Tail",
  claws: "Claws",
  body: "Body",
  back: "Back",
  wings: "Wings",
};
