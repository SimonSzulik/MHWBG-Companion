import assert from "node:assert/strict";
import {
  canCraftGear,
  catalog,
  hasHeldWeapon,
  weaponForgeGraph,
} from "./catalog";
import type { Hunter } from "./types";

function greatSwordHunter(overrides: Partial<Hunter> = {}): Hunter {
  return {
    id: "h1",
    name: "Hunter",
    weaponType: "Great Sword",
    equipped: { weapon: "buster-sword" },
    materials: {
      "dragonite-ore": 1,
      "malachite-ore": 1,
      "monster-bone-medium": 1,
    },
    ownedGear: ["buster-sword"],
    weaponStock: {},
    ...overrides,
  };
}

function runCatalogTests(): void {
  const starter = catalog.gear("buster-sword");
  const tier1 = catalog.gear("buster-blade");
  assert.ok(starter && tier1);

  const hunter = greatSwordHunter();
  assert.equal(hasHeldWeapon(hunter, "buster-sword"), true);
  assert.equal(canCraftGear(tier1, hunter), true);

  const graph = weaponForgeGraph("Great Sword", hunter);
  const starterGroup = graph.find((g) => g.rootId === "buster-sword");
  assert.ok(starterGroup);
  assert.ok(
    starterGroup.branches.every((b) => !b.locked),
    "starter sibling paths stay unlocked",
  );

  console.log("catalog.test.ts: all passed");
}

runCatalogTests();
