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
};

export function lootTableForMonster(monsterId: string): LootRow[] | undefined {
  return LOOT_TABLES[monsterId];
}

export const PART_LABELS: Record<MonsterPartId, string> = {
  head: "Kopf",
  tail: "Schwanz",
  claws: "Klauen",
  body: "Bauch",
  back: "Rücken",
  wings: "Flügel",
};
