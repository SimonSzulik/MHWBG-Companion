import { MAX_POTIONS } from "./downtime";
import type { ActiveQuest, Campaign, Hunter, HunterLootProgress } from "./types";

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

/** Duplicate investigation materials to every hunter; potions go to party stockpile. */
export function applyInvestigationLoot(
  campaign: Campaign,
  loot: Record<string, number>,
): Campaign {
  const materialLoot: Record<string, number> = {};
  let items = { ...campaign.items };

  for (const [id, qty] of Object.entries(loot)) {
    if (qty <= 0) continue;
    if (id === "potion") {
      items = {
        ...items,
        potion: Math.min(MAX_POTIONS, (items.potion ?? 0) + qty),
      };
    } else {
      materialLoot[id] = qty;
    }
  }

  const hunters =
    Object.keys(materialLoot).length === 0
      ? campaign.hunters
      : campaign.hunters.map((h) => applyMaterialsToHunter(h, materialLoot));

  return { ...campaign, items, hunters };
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
  investigationLoot: Record<string, number>;
  investigationPotions: number;
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
  const investigationPotions = loot.potion ?? 0;
  const investigationLoot = Object.fromEntries(
    Object.entries(loot).filter(([id]) => id !== "potion"),
  );

  const outcome = activeQuest.outcome;
  const showRolledLoot = outcome?.result === "success";
  const keptInvestigation =
    outcome?.result === "success" ||
    (outcome?.result === "failure" && outcome.keepInvestigationLoot === true);

  const perHunterLoot = hunters.map((h) => ({
    hunterId: h.id,
    name: h.name,
    quantities: showRolledLoot
      ? (activeQuest.lootProgress[h.id]?.lootQuantities ?? {})
      : {},
  }));

  return {
    investigationLoot,
    investigationPotions,
    perHunterLoot,
    outcome,
    showRolledLoot,
    keptInvestigation,
  };
}
