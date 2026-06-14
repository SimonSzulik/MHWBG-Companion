import { gameData } from "../data/gameData";
import { quests, questsForMonster, type QuestDef } from "../data/quests";
import type {
  ActiveDowntime,
  Campaign,
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
  { id: "fire", label: "Fire" },
  { id: "water", label: "Water" },
  { id: "thunder", label: "Thunder" },
  { id: "ice", label: "Ice" },
  { id: "dragon", label: "Dragon" },
];

export const DOWNTIME_ACTIVITIES: {
  id: Exclude<DowntimeActivityId, "handler">;
  label: string;
  description: string;
}[] = [
  {
    id: "provisions",
    label: "Provisions Stockpile",
    description:
      "Trade 3 common ores, bones, or pelts for 1 common material or 1 potion.",
  },
  {
    id: "resource-center",
    label: "Resource Center",
    description: "Roll 2 dice and take the reward from the table.",
  },
  {
    id: "chef",
    label: "Meowscular Chef",
    description: "+1 resistance to one element for the next quest.",
  },
  {
    id: "poogie",
    label: "Pet Poogie",
    description: "Good luck — or not. Just for fun.",
  },
];

export const HANDLER_ACTIVITY = {
  id: "handler" as const,
  label: "Visit the Handler",
  description:
    "Replay an exhausted investigation or tempered quest (all hunters must agree).",
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
    return `Offer exactly ${PROVISIONS_TRADE_COST} materials.`;
  }
  for (const [id, qty] of Object.entries(trade.offered)) {
    if (!isCommonTradeable(id)) return "Only common ores, bones, or pelts.";
    if ((hunter.materials[id] ?? 0) < qty) return "Not enough material.";
  }
  if (trade.rewardId === "potion") {
    if (potionCount >= MAX_POTIONS) return `Maximum ${MAX_POTIONS} potions.`;
    return undefined;
  }
  if (!isCommonTradeable(trade.rewardId)) {
    return "Invalid reward.";
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

export function mergeActiveDowntime(
  local: ActiveDowntime,
  remote: ActiveDowntime,
): ActiveDowntime {
  return {
    picks: { ...remote.picks, ...local.picks },
    provisions: { ...remote.provisions, ...local.provisions },
    resourceRoll: { ...remote.resourceRoll, ...local.resourceRoll },
    chefElement: { ...remote.chefElement, ...local.chefElement },
    poogieDone: { ...remote.poogieDone, ...local.poogieDone },
    handlerProposals: { ...remote.handlerProposals, ...local.handlerProposals },
    handlerQuestId: remote.handlerQuestId ?? local.handlerQuestId,
    confirmedHunterIds: [
      ...new Set([
        ...remote.confirmedHunterIds,
        ...local.confirmedHunterIds,
      ]),
    ],
  };
}

export function emptyActiveDowntime(): import("./types").ActiveDowntime {
  return {
    picks: {},
    provisions: {},
    resourceRoll: {},
    chefElement: {},
    handlerProposals: {},
    handlerQuestId: null,
    poogieDone: {},
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
  if (picks.includes("poogie") && !dt.poogieDone[hunterId]) return false;

  if (picks.includes("handler")) {
    if (!allHuntersPickedHandler(hunterIds, dt.picks)) return false;
    if (!dt.handlerProposals[hunterId]) return false;
    if (!dt.handlerQuestId) return false;
  }

  return true;
}

function applyProvisionsToHunter(
  hunter: Hunter,
  trade: ProvisionsTrade,
): Hunter {
  const materials = { ...hunter.materials };
  for (const [id, qty] of Object.entries(trade.offered)) {
    materials[id] = (materials[id] ?? 0) - qty;
    if (materials[id] <= 0) delete materials[id];
  }
  if (trade.rewardId !== "potion") {
    materials[trade.rewardId] = (materials[trade.rewardId] ?? 0) + 1;
  }
  return { ...hunter, materials };
}

/** Apply staged downtime rewards when all hunters confirm the day. */
export function applyDowntimeRewards(campaign: Campaign): Campaign {
  const dt = campaign.activeDowntime;
  if (!dt) return campaign;

  let items = { ...campaign.items };
  const hunters = campaign.hunters.map((hunter) => {
    const picks = dt.picks[hunter.id] ?? [];
    let next = hunter;

    if (picks.includes("provisions")) {
      const trade = dt.provisions[hunter.id];
      if (trade) {
        next = applyProvisionsToHunter(next, trade);
        if (trade.rewardId === "potion") {
          items.potion = Math.min(MAX_POTIONS, (items.potion ?? 0) + 1);
        }
      }
    }

    if (picks.includes("resource-center")) {
      const sum = dt.resourceRoll[hunter.id];
      if (sum != null) {
        const materialId = resolveResourceRoll(sum);
        if (materialId) {
          const materials = { ...next.materials };
          materials[materialId] = (materials[materialId] ?? 0) + 1;
          next = { ...next, materials };
        }
      }
    }

    if (picks.includes("chef")) {
      const element = dt.chefElement[hunter.id];
      if (element) {
        next = { ...next, elementResistance: element };
      }
    }

    return next;
  });

  return { ...campaign, items, hunters };
}
