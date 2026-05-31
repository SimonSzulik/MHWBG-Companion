import type { LootRow } from "../data/lootTables";
import type { MonsterPartId } from "./types";

export function rollDice(): [number, number] {
  const d = () => Math.floor(Math.random() * 6) + 1;
  return [d(), d()];
}

export type LootChoice = "split" | "sum";

/** Resolve loot rewards for a dice roll and player choice. */
export function resolveLootChoice(
  table: LootRow[],
  dice: [number, number],
  choice: LootChoice,
  brokenParts: MonsterPartId[],
): Record<string, number> {
  const [x, y] = dice;
  const rolls = choice === "split" ? [x, y] : [x + y];
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
