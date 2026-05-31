import type { GearSlot, WeaponType } from "./types";
import { gameData } from "../data/gameData";
import {
  CHAINMAIL_ARMOR_IDS,
  LEATHER_ARMOR_IDS,
} from "../data/starterArmor";

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
