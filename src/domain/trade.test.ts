import assert from "node:assert/strict";
import type { Campaign, Hunter, TradeRequest } from "./types";
import {
  applyTradeSwap,
  normalizeTradeRequest,
  pendingTradeWith,
  validateTradeProposal,
} from "./trade";

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

function campaign(hunters: Hunter[], trades: TradeRequest[] = []): Campaign {
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
    pendingTrades: trades,
    createdAt: 0,
    updatedAt: 0,
  };
}

function runTradeTests(): void {
  const a = hunter("a", { "quality-bone": 2 });
  const b = hunter("b", { "carbalite-ore": 1 });
  const c = campaign([a, b]);

  assert.equal(
    validateTradeProposal(c, "a", "b", { "quality-bone": 1 }, { "quality-bone": 1 }),
    "Same item cannot be on both sides.",
  );

  const existing: TradeRequest = {
    id: "t1",
    fromHunterId: "b",
    toHunterId: "a",
    offered: { "carbalite-ore": 1 },
    requested: { "quality-bone": 1 },
    status: "pending",
  };
  assert.equal(
    validateTradeProposal(
      campaign([a, b], [existing]),
      "a",
      "b",
      { "quality-bone": 1 },
      { "carbalite-ore": 1 },
    ),
    "A pending trade already exists with this hunter.",
  );

  assert.equal(pendingTradeWith([existing], "a", "b")?.id, "t1");

  const swapped = applyTradeSwap([a, b], {
    id: "t2",
    fromHunterId: "a",
    toHunterId: "b",
    offered: { "quality-bone": 1 },
    requested: { "carbalite-ore": 1 },
    status: "pending",
  });
  const nextA = swapped.find((h) => h.id === "a")!;
  const nextB = swapped.find((h) => h.id === "b")!;
  assert.equal(nextA.materials["quality-bone"], 1);
  assert.equal(nextA.materials["carbalite-ore"], 1);
  assert.equal(nextB.materials["carbalite-ore"], undefined);
  assert.equal(nextB.materials["quality-bone"], 1);

  const bundleSwap = applyTradeSwap(
    [
      hunter("a", { "quality-bone": 2, "carbalite-ore": 1 }),
      hunter("b", { "great-jagras-scale": 2, "bird-wyvern-gem": 1 }),
    ],
    {
      id: "t3",
      fromHunterId: "a",
      toHunterId: "b",
      offered: { "quality-bone": 2, "carbalite-ore": 1 },
      requested: { "great-jagras-scale": 1, "bird-wyvern-gem": 1 },
      status: "pending",
    },
  );
  const bundleA = bundleSwap.find((h) => h.id === "a")!;
  const bundleB = bundleSwap.find((h) => h.id === "b")!;
  assert.equal(bundleA.materials["quality-bone"], undefined);
  assert.equal(bundleA.materials["carbalite-ore"], undefined);
  assert.equal(bundleA.materials["great-jagras-scale"], 1);
  assert.equal(bundleA.materials["bird-wyvern-gem"], 1);
  assert.equal(bundleB.materials["quality-bone"], 2);
  assert.equal(bundleB.materials["carbalite-ore"], 1);
  assert.equal(bundleB.materials["great-jagras-scale"], 1);
  assert.equal(bundleB.materials["bird-wyvern-gem"], undefined);

  const legacy = normalizeTradeRequest({
    id: "legacy",
    fromHunterId: "a",
    toHunterId: "b",
    offeredMaterialId: "quality-bone",
    requestedMaterialId: "carbalite-ore",
    status: "pending",
  });
  assert.equal(legacy?.offered["quality-bone"], 1);
  assert.equal(legacy?.requested["carbalite-ore"], 1);
}

runTradeTests();
