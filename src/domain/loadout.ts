import type { GearDef, GearSlot, Hunter } from "./types";

const ARMOR_SLOTS: GearSlot[] = ["head", "chest", "legs"];

/** Weapons the hunter currently holds and can equip. */
export function equippableWeapons(hunter: Hunter, gear: GearDef[]): GearDef[] {
  const held = new Set(
    Object.entries(hunter.weaponStock ?? {})
      .filter(([, n]) => n > 0)
      .map(([id]) => id),
  );
  return gear.filter(
    (g) =>
      g.slot === "weapon" &&
      held.has(g.id) &&
      g.weaponType === hunter.weaponType,
  );
}

/** Forged armour pieces the hunter owns (helm, mail, greaves). */
export function equippableArmor(hunter: Hunter, gear: GearDef[]): GearDef[] {
  const owned = new Set(hunter.ownedGear);
  return gear.filter((g) => ARMOR_SLOTS.includes(g.slot) && owned.has(g.id));
}

export const LOADOUT_ARMOR_SLOTS: GearSlot[] = ARMOR_SLOTS;
