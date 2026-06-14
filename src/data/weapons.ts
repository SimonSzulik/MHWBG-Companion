import type { WeaponType } from "../domain/types";

export const IMPLEMENTED_WEAPONS: WeaponType[] = [
  "Great Sword",
  "Sword & Shield",
  "Bow",
  "Dual Blades",
  "Long Sword",
  "Hammer",
  "Gunlance",
  "Light Bowgun",
  "Lance",
  "Hunting Horn",
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
  { type: "Long Sword", tag: "spirit combo" },
  { type: "Hammer", tag: "blunt KO" },
  { type: "Gunlance", tag: "shelling guard" },
  { type: "Light Bowgun", tag: "mobile ammo" },
  { type: "Lance", tag: "guard & poke" },
  { type: "Hunting Horn", tag: "buff & bonk" },
  { type: "Switch Axe", tag: "axe ⇄ sword modes" },
  { type: "Charge Blade", tag: "defensive charge" },
  { type: "Insect Glaive", tag: "kinsect mobility" },
  { type: "Heavy Bowgun", tag: "ranged barrage" },
];

export function isWeaponImplemented(type: WeaponType): boolean {
  return IMPLEMENTED_WEAPONS.includes(type);
}
