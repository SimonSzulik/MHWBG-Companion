import type { GearSlot, Hunter, WeaponType } from "./types";
import { gameData } from "../data/gameData";
import {
  CHAINMAIL_ARMOR_IDS,
  LEATHER_ARMOR_IDS,
} from "../data/starterArmor";

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

/**
 * True when the hunter is missing their starter kit — i.e. a starter piece is
 * not yet in their forge history, or nothing is equipped at all (fresh join).
 * Progressing past the starter (equipping a forged upgrade) is NOT a reason to
 * re-apply the kit; this runs on every remote pull and must never undo crafts.
 */
export function hunterNeedsStarterKit(hunter: Hunter): boolean {
  const kit = starterKitFor(hunter.weaponType);
  if (kit.owned.length === 0) return false;
  if (!hunter.equipped.weapon) return true;
  return kit.owned.some((id) => !hunter.ownedGear.includes(id));
}

/**
 * Ensure the starter kit is present without clobbering progression: starter
 * pieces are merged into owned history, empty equip slots are filled, and the
 * starter weapon is seeded into the held-weapon stock when none exists.
 */
export function applyStarterKitToHunter(hunter: Hunter): Hunter {
  const kit = starterKitFor(hunter.weaponType);
  const allowedStarter = new Set([...STARTER_ARMOR_IDS, ...STARTER_WEAPON_IDS]);
  // Keep this weapon's starter + every forged piece; drop only stale starter
  // gear belonging to a different (previous) weapon type.
  const owned = hunter.ownedGear.filter(
    (id) => !allowedStarter.has(id) || kit.owned.includes(id),
  );
  // Only fill empty slots so a forged upgrade is never unequipped.
  const equipped = { ...hunter.equipped };
  for (const [slot, id] of Object.entries(kit.equipped)) {
    if (!equipped[slot as GearSlot]) equipped[slot as GearSlot] = id;
  }
  const weaponStock = { ...(hunter.weaponStock ?? {}) };
  if (kit.equipped.weapon && Object.keys(weaponStock).length === 0) {
    weaponStock[kit.equipped.weapon] = 1;
  }
  return {
    ...hunter,
    equipped,
    ownedGear: mergeOwned(owned, kit.owned),
    weaponStock,
  };
}
