import { MAX_POTIONS } from "./downtime";
import type {
  ActiveQuest,
  Campaign,
  Hunter,
  HunterLootProgress,
  InvestigationLootByHunter,
} from "./types";

function applyMaterialsToHunter(
  hunter: Hunter,
  rewards: Record<string, number>,
): Hunter {
  const materials = { ...hunter.materials };
  for (const [id, qty] of Object.entries(rewards)) {
    if (qty <= 0) continue;
    materials[id] = (materials[id] ?? 0) + qty;
  }
  return { ...hunter, materials };
}

/** Migrate legacy flat investigation loot to per-hunter buckets. */
export function migrateInvestigationLoot(
  raw: unknown,
  startedByHunterId?: string,
): InvestigationLootByHunter {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const firstVal = Object.values(o)[0];
  if (firstVal && typeof firstVal === "object" && !Array.isArray(firstVal)) {
    return o as InvestigationLootByHunter;
  }
  if (startedByHunterId && Object.keys(o).length > 0) {
    return { [startedByHunterId]: o as Record<string, number> };
  }
  return {};
}

export function hunterInvestigationLoot(
  loot: InvestigationLootByHunter | undefined,
  hunterId: string,
): Record<string, number> {
  return loot?.[hunterId] ?? {};
}

export function totalInvestigationPotions(
  loot: InvestigationLootByHunter | undefined,
): number {
  let total = 0;
  for (const bucket of Object.values(loot ?? {})) {
    total += bucket.potion ?? 0;
  }
  return total;
}

export function hasAnyInvestigationLoot(
  loot: InvestigationLootByHunter | undefined,
): boolean {
  return Object.values(loot ?? {}).some((bucket) =>
    Object.values(bucket).some((qty) => qty > 0),
  );
}

/** Apply investigation materials to a single hunter (excludes potions). */
export function applyInvestigationLootToHunter(
  campaign: Campaign,
  hunterId: string,
  loot: Record<string, number>,
): Campaign {
  const materialLoot: Record<string, number> = {};
  for (const [id, qty] of Object.entries(loot)) {
    if (qty <= 0 || id === "potion") continue;
    materialLoot[id] = qty;
  }
  if (Object.keys(materialLoot).length === 0) return campaign;
  return {
    ...campaign,
    hunters: campaign.hunters.map((h) =>
      h.id === hunterId ? applyMaterialsToHunter(h, materialLoot) : h,
    ),
  };
}

/** Add remaining investigation potions to party stockpile once per quest. */
export function applyPartyPotionsOnce(
  campaign: Campaign,
  loot: InvestigationLootByHunter,
  alreadyApplied: boolean,
): { campaign: Campaign; applied: boolean } {
  if (alreadyApplied) return { campaign, applied: false };
  const potionQty = totalInvestigationPotions(loot);
  if (potionQty <= 0) return { campaign, applied: false };
  return {
    campaign: {
      ...campaign,
      items: {
        ...campaign.items,
        potion: Math.min(MAX_POTIONS, (campaign.items.potion ?? 0) + potionQty),
      },
    },
    applied: true,
  };
}

export type PersonalLootSummary = {
  materials: Record<string, number>;
  potionsToParty: number;
};

/** Merged investigation + rolled loot for one hunter's reward popup. */
export function buildPersonalLootSummary(
  activeQuest: ActiveQuest,
  hunterId: string,
): PersonalLootSummary {
  const investigation = hunterInvestigationLoot(
    activeQuest.investigationLoot,
    hunterId,
  );
  const rolled =
    activeQuest.lootProgress[hunterId]?.lootQuantities ?? {};

  const materials: Record<string, number> = {};
  for (const [id, qty] of Object.entries(investigation)) {
    if (id === "potion" || qty <= 0) continue;
    materials[id] = (materials[id] ?? 0) + qty;
  }
  for (const [id, qty] of Object.entries(rolled)) {
    if (qty <= 0) continue;
    materials[id] = (materials[id] ?? 0) + qty;
  }

  const potionsToParty =
    !activeQuest.partyPotionsApplied && (investigation.potion ?? 0) > 0
      ? (investigation.potion ?? 0)
      : 0;

  return { materials, potionsToParty };
}

/** Apply each hunter's investigation loot; potions go to party stockpile. */
export function applyInvestigationLoot(
  campaign: Campaign,
  loot: InvestigationLootByHunter,
): Campaign {
  let next = campaign;
  for (const hunter of campaign.hunters) {
    next = applyInvestigationLootToHunter(
      next,
      hunter.id,
      loot[hunter.id] ?? {},
    );
  }
  const potionQty = totalInvestigationPotions(loot);
  if (potionQty > 0) {
    next = {
      ...next,
      items: {
        ...next.items,
        potion: Math.min(MAX_POTIONS, (next.items.potion ?? 0) + potionQty),
      },
    };
  }
  return next;
}

/** Apply per-hunter rolled loot from the looting phase. */
export function applyLootProgress(
  campaign: Campaign,
  lootProgress: Record<string, HunterLootProgress>,
): Campaign {
  return {
    ...campaign,
    hunters: campaign.hunters.map((h) => {
      const progress = lootProgress[h.id];
      if (!progress?.confirmed) return h;
      return applyMaterialsToHunter(h, progress.lootQuantities);
    }),
  };
}

export type QuestSummaryView = {
  perHunterInvestigation: {
    hunterId: string;
    name: string;
    materials: Record<string, number>;
    potions: number;
  }[];
  perHunterLoot: {
    hunterId: string;
    name: string;
    quantities: Record<string, number>;
  }[];
  outcome?: ActiveQuest["outcome"];
  showRolledLoot: boolean;
  keptInvestigation: boolean;
};

export function buildQuestSummary(
  activeQuest: ActiveQuest,
  hunters: { id: string; name: string }[],
): QuestSummaryView {
  const loot = activeQuest.investigationLoot ?? {};

  const outcome = activeQuest.outcome;
  const showRolledLoot = outcome?.result === "success";
  const keptInvestigation =
    outcome?.result === "success" ||
    (outcome?.result === "failure" && outcome.keepInvestigationLoot === true);

  const perHunterInvestigation = hunters.map((h) => {
    const bucket = loot[h.id] ?? {};
    const materials = Object.fromEntries(
      Object.entries(bucket).filter(([id]) => id !== "potion"),
    );
    return {
      hunterId: h.id,
      name: h.name,
      materials,
      potions: bucket.potion ?? 0,
    };
  });

  const perHunterLoot = hunters.map((h) => ({
    hunterId: h.id,
    name: h.name,
    quantities: showRolledLoot
      ? (activeQuest.lootProgress[h.id]?.lootQuantities ?? {})
      : {},
  }));

  return {
    perHunterInvestigation,
    perHunterLoot,
    outcome,
    showRolledLoot,
    keptInvestigation,
  };
}
