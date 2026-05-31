import { wildspireWaste } from "../data/wildspireWaste";
import type { Campaign, GearDef } from "./types";

/** Indexed lookups over the static catalog. */
const materialsById = new Map(wildspireWaste.materials.map((m) => [m.id, m]));
const itemsById = new Map(wildspireWaste.items.map((i) => [i.id, i]));
const gearById = new Map(wildspireWaste.gear.map((g) => [g.id, g]));
const monstersById = new Map(wildspireWaste.monsters.map((m) => [m.id, m]));

export const catalog = {
  material: (id: string) => materialsById.get(id),
  item: (id: string) => itemsById.get(id),
  gear: (id: string) => gearById.get(id),
  monster: (id: string) => monstersById.get(id),
  all: wildspireWaste,
};

/** Craftability of a gear def given the current campaign state. */
export type CraftState = "owned" | "craftable" | "missing";

export function craftState(gear: GearDef, campaign: Campaign): CraftState {
  if (campaign.ownedGear.includes(gear.id)) return "owned";
  const enoughMats = gear.cost.every(
    (c) => (campaign.materials[c.materialId] ?? 0) >= c.qty,
  );
  const enoughZenny = (gear.zenny ?? 0) <= campaign.zenny;
  return enoughMats && enoughZenny ? "craftable" : "missing";
}
