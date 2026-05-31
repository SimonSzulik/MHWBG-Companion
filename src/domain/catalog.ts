import { gameData } from "../data/gameData";
import type {
  ArmorForgeSet,
  Campaign,
  GearDef,
  Hunter,
  WeaponForgePath,
  WeaponType,
} from "./types";

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
  hunter: Hunter,
): boolean {
  return path.gearIds.some((id) => {
    const gear = catalog.gear(id);
    return gear && craftState(gear, hunter) === "craftable";
  });
}

export function pathProgressName(
  path: ForgePathLike,
  hunter: Hunter,
): string {
  let lastOwned: string | null = null;
  for (const id of path.gearIds) {
    if (hunter.ownedGear.includes(id)) {
      const gear = catalog.gear(id);
      if (gear) lastOwned = gear.name;
    }
  }
  return lastOwned ?? "Noch nicht begonnen";
}

export function setProgressLabel(
  set: ForgePathLike,
  hunter: Hunter,
): string {
  const owned = set.gearIds
    .filter((id) => hunter.ownedGear.includes(id))
    .map((id) => catalog.gear(id)?.name)
    .filter(Boolean) as string[];
  if (owned.length === 0) return "Noch nichts geschmiedet";
  return owned.join(" · ");
}

export function canCraftGear(gear: GearDef, hunter: Hunter): boolean {
  if (
    gear.slot === "weapon" &&
    gear.pathId != null &&
    gear.pathOrder != null &&
    gear.pathOrder > 0
  ) {
    const path = gameData.weaponPaths?.find((p) => p.id === gear.pathId);
    const prevId = path?.gearIds[gear.pathOrder - 1];
    if (prevId && !hunter.ownedGear.includes(prevId)) return false;
  }
  return true;
}

export function craftState(gear: GearDef, hunter: Hunter): CraftState {
  if (hunter.ownedGear.includes(gear.id)) return "owned";
  if (!canCraftGear(gear, hunter)) return "missing";
  const enoughMats = gear.cost.every(
    (c) => (hunter.materials[c.materialId] ?? 0) >= c.qty,
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
