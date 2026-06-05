import { gameData } from "../data/gameData";
import { quests, questsForMonster, type QuestDef } from "../data/quests";
import type {
  DowntimeActivityId,
  Hunter,
  MaterialStash,
  ProvisionsTrade,
} from "./types";
import {
  isQuestFullyCompleted,
  isQuestTierUnlocked,
  questCategory,
} from "./quests";

export type { ElementType } from "./types";

export const ELEMENT_TYPES: { id: import("./types").ElementType; label: string }[] = [
  { id: "fire", label: "Feuer" },
  { id: "water", label: "Wasser" },
  { id: "thunder", label: "Blitz" },
  { id: "ice", label: "Eis" },
  { id: "dragon", label: "Drache" },
];

export const DOWNTIME_ACTIVITIES: {
  id: Exclude<DowntimeActivityId, "handler">;
  label: string;
  description: string;
}[] = [
  {
    id: "provisions",
    label: "Vorratslager",
    description:
      "3 gewöhnliche Erze, Knochen oder Felle abgeben → 1 gewöhnliches Material oder 1 Trank.",
  },
  {
    id: "resource-center",
    label: "Ressourcenzentrum",
    description: "2 Würfel würfeln und Belohnung von der Tabelle erhalten.",
  },
  {
    id: "chef",
    label: "Meowscular Chef",
    description: "+1 Widerstand gegen ein Element für die nächste Quest.",
  },
  {
    id: "poogie",
    label: "Poogie streicheln",
    description: "Bringt Glück – oder eben nicht. Nur zum Spaß.",
  },
];

export const HANDLER_ACTIVITY = {
  id: "handler" as const,
  label: "Handler besuchen",
  description:
    "Erschöpfte Untersuchungs- oder Temperierte Quest erneut wählen (alle Jäger müssen zustimmen).",
};

export const MAX_DOWNTIME_PICKS = 3;
export const MAX_POTIONS = 3;
export const PROVISIONS_TRADE_COST = 3;

/** Resource Center 2d6 reward table (rulebook). */
export const RESOURCE_CENTER_TABLE: Record<number, string> = {
  2: "carbalite-ore",
  3: "malachite-ore",
  4: "dragonite-ore",
  5: "fucium-ore",
  6: "quality-bone",
  7: "monster-bone-small",
  8: "ancient-bone",
  9: "dragonvein-crystal",
  10: "boulder-bone",
  11: "coral-crystal",
  12: "firecell-stone",
};

/** Common ores, bones, hides tradeable at the Provisions Stockpile. */
export function commonTradeableMaterialIds(): string[] {
  return gameData.materials
    .filter((m) => m.group === "material")
    .map((m) => m.id);
}

export function isCommonTradeable(materialId: string): boolean {
  return commonTradeableMaterialIds().includes(materialId);
}

export function provisionsOfferTotal(offered: MaterialStash): number {
  return Object.values(offered).reduce((s, q) => s + q, 0);
}

export function canTradeProvisions(
  hunter: Hunter,
  trade: ProvisionsTrade,
  potionCount: number,
): string | undefined {
  const total = provisionsOfferTotal(trade.offered);
  if (total !== PROVISIONS_TRADE_COST) {
    return `Genau ${PROVISIONS_TRADE_COST} Materialien abgeben.`;
  }
  for (const [id, qty] of Object.entries(trade.offered)) {
    if (!isCommonTradeable(id)) return "Nur gewöhnliche Erze, Knochen oder Felle.";
    if ((hunter.materials[id] ?? 0) < qty) return "Material fehlt.";
  }
  if (trade.rewardId === "potion") {
    if (potionCount >= MAX_POTIONS) return `Maximal ${MAX_POTIONS} Tränke.`;
    return undefined;
  }
  if (!isCommonTradeable(trade.rewardId)) {
    return "Ungültige Belohnung.";
  }
  return undefined;
}

export function resolveResourceRoll(sum: number): string | undefined {
  if (sum < 2 || sum > 12 || !Number.isInteger(sum)) return undefined;
  return RESOURCE_CENTER_TABLE[sum];
}

/** True when every hunter included handler in their 3 picks. */
export function allHuntersPickedHandler(
  hunterIds: string[],
  picks: Record<string, DowntimeActivityId[] | undefined>,
): boolean {
  if (hunterIds.length === 0) return false;
  return hunterIds.every((id) => (picks[id] ?? []).includes("handler"));
}

/** Handler pool: exhausted investigation/tempered with 1★ done. */
export function handlerQuestPool(
  completions: Record<string, number>,
): QuestDef[] {
  return quests.filter((q) => {
    const cat = questCategory(q);
    if (cat === "assigned") return false;
    const count = completions[q.id] ?? 0;
    if (!isQuestFullyCompleted(q, count)) return false;
    return isQuestTierUnlocked(q, completions, questsForMonster(q.monsterId));
  });
}

export function roll2d6(): number {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return d1 + d2;
}

export function hunterPickedHandler(picks: DowntimeActivityId[]): boolean {
  return picks.includes("handler");
}

export function emptyActiveDowntime(): import("./types").ActiveDowntime {
  return {
    picks: {},
    provisions: {},
    resourceRoll: {},
    chefElement: {},
    handlerProposals: {},
    handlerQuestId: null,
    confirmedHunterIds: [],
  };
}

export function syncHandlerQuestId(
  dt: import("./types").ActiveDowntime,
  hunterIds: string[],
): import("./types").ActiveDowntime {
  if (hunterIds.length === 0) return { ...dt, handlerQuestId: null };
  const proposals = hunterIds.map((id) => dt.handlerProposals[id]).filter(Boolean);
  if (proposals.length !== hunterIds.length) {
    return { ...dt, handlerQuestId: null };
  }
  const first = proposals[0];
  const unanimous = proposals.every((p) => p === first);
  return { ...dt, handlerQuestId: unanimous ? first! : null };
}

export function isHunterDowntimeReady(
  hunterId: string,
  dt: import("./types").ActiveDowntime,
  hunterIds: string[],
): boolean {
  const picks = dt.picks[hunterId] ?? [];
  if (picks.length !== MAX_DOWNTIME_PICKS) return false;

  if (picks.includes("provisions") && !dt.provisions[hunterId]) return false;
  if (picks.includes("resource-center") && dt.resourceRoll[hunterId] == null) {
    return false;
  }
  if (picks.includes("chef") && !dt.chefElement[hunterId]) return false;

  if (picks.includes("handler")) {
    if (!allHuntersPickedHandler(hunterIds, dt.picks)) return false;
    if (!dt.handlerProposals[hunterId]) return false;
    if (!dt.handlerQuestId) return false;
  }

  return true;
}
