import type { WeaponType } from "../domain/types";

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
