import assert from "node:assert/strict";
import type { Campaign, Hunter, TradeRequest } from "./types";
import {
  applyTradeSwap,
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
    validateTradeProposal(c, "a", "b", "quality-bone", "quality-bone"),
    "Offer a different material than you request.",
  );

  const existing: TradeRequest = {
    id: "t1",
    fromHunterId: "b",
    toHunterId: "a",
    offeredMaterialId: "carbalite-ore",
    requestedMaterialId: "quality-bone",
    status: "pending",
  };
  assert.equal(
    validateTradeProposal(
      campaign([a, b], [existing]),
      "a",
      "b",
      "quality-bone",
      "carbalite-ore",
    ),
    "A pending trade already exists with this hunter.",
  );

  assert.equal(pendingTradeWith([existing], "a", "b")?.id, "t1");

  const swapped = applyTradeSwap([a, b], {
    id: "t2",
    fromHunterId: "a",
    toHunterId: "b",
    offeredMaterialId: "quality-bone",
    requestedMaterialId: "carbalite-ore",
    status: "pending",
  });
  const nextA = swapped.find((h) => h.id === "a")!;
  const nextB = swapped.find((h) => h.id === "b")!;
  assert.equal(nextA.materials["quality-bone"], 1);
  assert.equal(nextA.materials["carbalite-ore"], 1);
  assert.equal(nextB.materials["carbalite-ore"], undefined);
  assert.equal(nextB.materials["quality-bone"], 1);
}

runTradeTests();
