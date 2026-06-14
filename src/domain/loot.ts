import type { LootRow } from "../data/lootTables";
import type { MonsterPartId } from "./types";

export function rollDice(): [number, number] {
  const d = () => Math.floor(Math.random() * 6) + 1;
  return [d(), d()];
}

export type LootChoice = "die1" | "die2" | "sum";

/** Resolve loot rewards for a dice roll and player choice. */
export function resolveLootChoice(
  table: LootRow[],
  dice: [number, number],
  choice: LootChoice,
  brokenParts: MonsterPartId[],
): Record<string, number> {
  const [x, y] = dice;
  const rolls =
    choice === "die1" ? [x] : choice === "die2" ? [y] : [x + y];
  const rewards: Record<string, number> = {};

  for (const roll of rolls) {
    if (roll < 1 || roll > 12) continue;
    const row = table.find((r) => r.roll === roll);
    if (!row) continue;
    rewards[row.materialId] = (rewards[row.materialId] ?? 0) + 1;
    if (row.partBreak && brokenParts.includes(row.partBreak)) {
      rewards[row.materialId] = (rewards[row.materialId] ?? 0) + 1;
    }
  }

  return rewards;
}

export function rowForRoll(table: LootRow[], roll: number): LootRow | undefined {
  return table.find((r) => r.roll === roll);
}

export interface LootPreview {
  materials: Record<string, number>;
  brokenParts: MonsterPartId[];
  partBreakMaterials: Record<string, number>;
}

/** Full loot preview including part-break bonus breakdown. */
export function buildLootPreview(
  table: LootRow[],
  dice: [number, number],
  choice: LootChoice | undefined,
  brokenParts: MonsterPartId[],
): LootPreview {
  if (!choice) {
    return { materials: {}, brokenParts, partBreakMaterials: {} };
  }
  const materials = resolveLootChoice(table, dice, choice, brokenParts);
  const baseOnly = resolveLootChoice(table, dice, choice, []);
  const partBreakMaterials: Record<string, number> = {};
  for (const [id, qty] of Object.entries(materials)) {
    const bonus = qty - (baseOnly[id] ?? 0);
    if (bonus > 0) partBreakMaterials[id] = bonus;
  }
  return { materials, brokenParts, partBreakMaterials };
}

/** Seed manual loot quantities from dice rules. */
export function seedLootQuantities(
  table: LootRow[],
  dice: [number, number],
  choice: LootChoice,
  brokenParts: MonsterPartId[],
): Record<string, number> {
  return resolveLootChoice(table, dice, choice, brokenParts);
}
