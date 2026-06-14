import assert from "node:assert/strict";
import type { ActiveQuest, Campaign, Hunter } from "./types";
import {
  aggregateInvestigationMaterials,
  applyInvestigationLoot,
  buildQuestDayReport,
} from "./questRewards";

function hunter(id: string, materials: Record<string, number> = {}): Hunter {
  return {
    id,
    name: id,
    weaponType: "great-sword",
    equipped: {},
    materials,
    ownedGear: [],
  };
}

function campaign(hunters: Hunter[]): Campaign {
  return {
    id: "c1",
    name: "Test",
    box: "af",
    day: 1,
    maxDay: 60,
    leaderId: hunters[0]?.id ?? "a",
    hunters,
    zenny: 0,
    items: {},
    questCompletions: {},
    activeQuest: null,
    dayLog: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

function runQuestRewardsTests(): void {
  const loot = {
    a: { "quality-bone": 2 },
    b: { "carbalite-ore": 1 },
  };
  const agg = aggregateInvestigationMaterials(loot);
  assert.equal(agg["quality-bone"], 2);
  assert.equal(agg["carbalite-ore"], 1);
  assert.equal(agg.potion, undefined);

  const c = campaign([hunter("a"), hunter("b")]);
  const next = applyInvestigationLoot(c, loot);
  const a = next.hunters.find((h) => h.id === "a")!;
  const b = next.hunters.find((h) => h.id === "b")!;
  assert.equal(a.materials["quality-bone"], 2);
  assert.equal(a.materials["carbalite-ore"], 1);
  assert.equal(b.materials["quality-bone"], 2);
  assert.equal(b.materials["carbalite-ore"], 1);

  const aq: ActiveQuest = {
    questId: "great-jagras-2",
    phase: "looting",
    readyHunterIds: ["a", "b"],
    startedByHunterId: "a",
    lootProgress: {
      a: {
        dice: [3, 4],
        choice: "die1",
        brokenParts: [],
        lootQuantities: { "great-jagras-hide": 1 },
        confirmed: true,
      },
    },
    investigationLoot: loot,
  };
  const report = buildQuestDayReport(aq);
  assert.equal(report.questId, "great-jagras-2");
  assert.equal(report.investigationLoot.a["quality-bone"], 2);
  assert.equal(report.rolledLoot.a["great-jagras-hide"], 1);
}

runQuestRewardsTests();
