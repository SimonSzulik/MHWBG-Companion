import type { GearDef } from "../domain/types";

/** Campaign-start armour (not forgeable; granted on create/join). */
export const starterArmorGear: GearDef[] = [
  {
    id: "chainmail-hedger",
    name: "Chainmail Hedger",
    slot: "head",
    cost: [],
    tierIcon: "white-head",
    isStarter: true,
    defense: 0,
  },
  {
    id: "chainmail-vest",
    name: "Chainmail Vest",
    slot: "chest",
    cost: [],
    tierIcon: "white-mail",
    isStarter: true,
    defense: 0,
  },
  {
    id: "chainmail-trousers",
    name: "Chainmail Trousers",
    slot: "legs",
    cost: [],
    tierIcon: "white-greaves",
    isStarter: true,
    defense: 0,
  },
  {
    id: "leather-hedger",
    name: "Leather Hedger",
    slot: "head",
    cost: [],
    tierIcon: "white-head",
    isStarter: true,
    defense: 0,
  },
  {
    id: "leather-vest",
    name: "Leather Vest",
    slot: "chest",
    cost: [],
    tierIcon: "white-mail",
    isStarter: true,
    defense: 0,
  },
  {
    id: "leather-trousers",
    name: "Leather Trousers",
    slot: "legs",
    cost: [],
    tierIcon: "white-greaves",
    isStarter: true,
    defense: 0,
  },
];

/** Starter armour ids per weapon-type group. */
export const CHAINMAIL_ARMOR_IDS = [
  "chainmail-hedger",
  "chainmail-vest",
  "chainmail-trousers",
] as const;

export const LEATHER_ARMOR_IDS = [
  "leather-hedger",
  "leather-vest",
  "leather-trousers",
] as const;
