import { gameData } from "../data/gameData";
import type {
  Campaign,
  GearDef,
  WeaponForgePath,
  WeaponType,
} from "./types";

/** Indexed lookups over the static catalog. */
const materialsById = new Map(gameData.materials.map((m) => [m.id, m]));
const itemsById = new Map(gameData.items.map((i) => [i.id, i]));
const gearById = new Map(gameData.gear.map((g) => [g.id, g]));
const monstersById = new Map(gameData.monsters.map((m) => [m.id, m]));

export const catalog = {
  material: (id: string) => materialsById.get(id),
  item: (id: string) => itemsById.get(id),
  gear: (id: string) => gearById.get(id),
  monster: (id: string) => monstersById.get(id),
  all: gameData,
};

/** Craftability of a gear def given the current campaign state. */
export type CraftState = "owned" | "craftable" | "missing";

export function pathsForWeapon(weaponType: WeaponType): WeaponForgePath[] {
  return (gameData.weaponPaths ?? []).filter((p) => p.weaponType === weaponType);
}

export function pathHasCraftable(
  path: WeaponForgePath,
  campaign: Campaign,
): boolean {
  return path.gearIds.some((id) => {
    const gear = catalog.gear(id);
    return gear && craftState(gear, campaign) === "craftable";
  });
}

/** Whether sequential forge prerequisites are met. */
export function canCraftGear(gear: GearDef, campaign: Campaign): boolean {
  if (gear.pathId != null && gear.pathOrder != null && gear.pathOrder > 0) {
    const path = gameData.weaponPaths?.find((p) => p.id === gear.pathId);
    const prevId = path?.gearIds[gear.pathOrder - 1];
    if (prevId && !campaign.ownedGear.includes(prevId)) return false;
  }
  return true;
}

export function craftState(gear: GearDef, campaign: Campaign): CraftState {
  if (campaign.ownedGear.includes(gear.id)) return "owned";
  if (!canCraftGear(gear, campaign)) return "missing";
  const enoughMats = gear.cost.every(
    (c) => (campaign.materials[c.materialId] ?? 0) >= c.qty,
  );
  return enoughMats ? "craftable" : "missing";
}

export function isEquipped(
  gearId: string,
  campaign: Campaign,
): boolean {
  return campaign.hunters.some((h) => h.equipped.weapon === gearId);
}
