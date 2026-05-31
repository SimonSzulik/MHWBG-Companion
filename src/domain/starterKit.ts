import type { GearSlot, Hunter, WeaponType } from "./types";
import { gameData } from "../data/gameData";
import {
  CHAINMAIL_ARMOR_IDS,
  LEATHER_ARMOR_IDS,
} from "../data/starterArmor";
import { catalog } from "./catalog";

const ARMOR_SLOTS: GearSlot[] = ["head", "chest", "legs"];

const STARTER_ARMOR_IDS = new Set<string>([
  ...CHAINMAIL_ARMOR_IDS,
  ...LEATHER_ARMOR_IDS,
]);

const STARTER_WEAPON_IDS = new Set(
  gameData.gear
    .filter((g) => g.slot === "weapon" && g.isStarter)
    .map((g) => g.id),
);

const CHAINMAIL_WEAPONS: WeaponType[] = ["Great Sword", "Bow"];
const LEATHER_WEAPONS: WeaponType[] = ["Sword & Shield", "Dual Blades"];

function starterWeaponId(weaponType: WeaponType): string | null {
  const starter = gameData.gear.find(
    (g) =>
      g.slot === "weapon" &&
      g.weaponType === weaponType &&
      g.isStarter === true,
  );
  if (starter) return starter.id;
  const fallback = gameData.gear.find(
    (g) =>
      g.slot === "weapon" && g.weaponType === weaponType && g.cost.length === 0,
  );
  return fallback?.id ?? null;
}

function starterArmorIds(weaponType: WeaponType): readonly string[] {
  if (CHAINMAIL_WEAPONS.includes(weaponType)) return CHAINMAIL_ARMOR_IDS;
  if (LEATHER_WEAPONS.includes(weaponType)) return LEATHER_ARMOR_IDS;
  return [];
}

export interface StarterKit {
  owned: string[];
  equipped: Partial<Record<GearSlot, string>>;
}

/** Full starter kit (weapon + armour) for a weapon type. */
export function starterKitFor(weaponType: WeaponType): StarterKit {
  const weapon = starterWeaponId(weaponType);
  const armor = starterArmorIds(weaponType);
  const owned = [...(weapon ? [weapon] : []), ...armor];
  const equipped: Partial<Record<GearSlot, string>> = {};
  if (weapon) equipped.weapon = weapon;
  if (armor[0]) equipped.head = armor[0];
  if (armor[1]) equipped.chest = armor[1];
  if (armor[2]) equipped.legs = armor[2];
  return { owned, equipped };
}

/** Starter armour ids for the active hunter's weapon type. */
export function starterArmorForWeapon(weaponType: WeaponType): string[] {
  return [...starterArmorIds(weaponType)];
}

function mergeOwned(existing: string[], additions: string[]): string[] {
  return Array.from(new Set([...existing, ...additions]));
}

/** True when weapon/armour/owned gear does not match the kit for this weapon type. */
export function hunterNeedsStarterKit(hunter: Hunter): boolean {
  const kit = starterKitFor(hunter.weaponType);
  if (kit.owned.length === 0) return false;

  const weaponId = hunter.equipped.weapon;
  if (!weaponId) return true;

  const weapon = catalog.gear(weaponId);
  if (weapon?.weaponType !== hunter.weaponType) return true;
  if (kit.equipped.weapon && weaponId !== kit.equipped.weapon) return true;

  for (const slot of ARMOR_SLOTS) {
    const expected = kit.equipped[slot];
    if (expected && hunter.equipped[slot] !== expected) return true;
  }

  for (const id of kit.owned) {
    if (!hunter.ownedGear.includes(id)) return true;
  }

  return false;
}

/** Apply (or replace) the full starter kit for the hunter's weapon type. */
export function applyStarterKitToHunter(hunter: Hunter): Hunter {
  const kit = starterKitFor(hunter.weaponType);
  const allowedStarter = new Set([...STARTER_ARMOR_IDS, ...STARTER_WEAPON_IDS]);
  const owned = hunter.ownedGear.filter(
    (id) => !allowedStarter.has(id) || kit.owned.includes(id),
  );
  return {
    ...hunter,
    equipped: { ...hunter.equipped, ...kit.equipped },
    ownedGear: mergeOwned(owned, kit.owned),
  };
}
