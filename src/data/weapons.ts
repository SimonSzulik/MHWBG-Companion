import type { WeaponType } from "../domain/types";

export const IMPLEMENTED_WEAPONS: WeaponType[] = [
  "Great Sword",
  "Sword & Shield",
  "Bow",
  "Dual Blades",
];

export const COMING_SOON_WEAPONS: WeaponType[] = [
  "Switch Axe",
  "Charge Blade",
  "Insect Glaive",
  "Heavy Bowgun",
];

export const ALL_WEAPONS: { type: WeaponType; tag: string }[] = [
  { type: "Great Sword", tag: "heavy cleaves" },
  { type: "Sword & Shield", tag: "guard & slash" },
  { type: "Bow", tag: "coating & pierce" },
  { type: "Dual Blades", tag: "dual wield" },
  { type: "Switch Axe", tag: "axe ⇄ sword modes" },
  { type: "Charge Blade", tag: "defensive charge" },
  { type: "Insect Glaive", tag: "kinsect mobility" },
  { type: "Heavy Bowgun", tag: "ranged barrage" },
];

export function isWeaponImplemented(type: WeaponType): boolean {
  return IMPLEMENTED_WEAPONS.includes(type);
}
