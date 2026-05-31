import { gameData } from "../data/gameData";
import type {
  ArmorForgeSet,
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

export interface ForgePathLike {
  id: string;
  label: string;
  icon: string;
  gearIds: string[];
}

export function pathsForWeapon(weaponType: WeaponType): WeaponForgePath[] {
  return (gameData.weaponPaths ?? []).filter((p) => p.weaponType === weaponType);
}

export function armorSets(): ArmorForgeSet[] {
  return gameData.armorSets ?? [];
}

export function pathHasCraftable(
  path: ForgePathLike,
  campaign: Campaign,
): boolean {
  return path.gearIds.some((id) => {
    const gear = catalog.gear(id);
    return gear && craftState(gear, campaign) === "craftable";
  });
}

/** Highest owned weapon name in a sequential path, or fallback. */
export function pathProgressName(
  path: ForgePathLike,
  campaign: Campaign,
): string {
  let lastOwned: string | null = null;
  for (const id of path.gearIds) {
    if (campaign.ownedGear.includes(id)) {
      const gear = catalog.gear(id);
      if (gear) lastOwned = gear.name;
    }
  }
  return lastOwned ?? "Noch nicht begonnen";
}

/** Owned armour piece names in a set, or fallback. */
export function setProgressLabel(
  set: ForgePathLike,
  campaign: Campaign,
): string {
  const owned = set.gearIds
    .filter((id) => campaign.ownedGear.includes(id))
    .map((id) => catalog.gear(id)?.name)
    .filter(Boolean) as string[];
  if (owned.length === 0) return "Noch nichts geschmiedet";
  return owned.join(" · ");
}

/** Whether sequential forge prerequisites are met. */
export function canCraftGear(gear: GearDef, campaign: Campaign): boolean {
  if (
    gear.slot === "weapon" &&
    gear.pathId != null &&
    gear.pathOrder != null &&
    gear.pathOrder > 0
  ) {
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


export function isEquipped(gearId: string, campaign: Campaign): boolean {
  const gear = catalog.gear(gearId);
  if (!gear) return false;
  return campaign.hunters.some((h) => {
    if (gear.slot === "weapon") return h.equipped.weapon === gearId;
    return h.equipped[gear.slot] === gearId;
  });
}
