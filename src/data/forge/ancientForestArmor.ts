import type { ArmorForgeSet, Cost, GearDef } from "../../domain/types";

function a(
  id: string,
  name: string,
  slot: "head" | "chest" | "legs",
  pathId: string,
  pathOrder: number,
  opts: {
    cost: Cost[];
    tierIcon: string;
    pathIcon: string;
    defense?: number;
    effect?: string;
  },
): GearDef {
  return {
    id,
    name,
    slot,
    pathId,
    pathOrder,
    cost: opts.cost,
    tierIcon: opts.tierIcon,
    pathIcon: opts.pathIcon,
    defense: opts.defense,
    effect: opts.effect,
  };
}

/** Forge gear for Ancient Forest armour reference cards. */
export const ancientForestArmorGear: GearDef[] = [
  // ----- Alloy -----
  a("alloy-helm", "Alloy Helm", "head", "armor-alloy", 0, {
    tierIcon: "yellow-helm",
    pathIcon: "white-ore",
    cost: [
      { materialId: "malachite-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 1 },
      { materialId: "dragonite-ore", qty: 1 },
    ],
    defense: 1,
  }),
  a("alloy-mail", "Alloy Mail", "chest", "armor-alloy", 1, {
    tierIcon: "yellow-mail",
    pathIcon: "white-ore",
    cost: [
      { materialId: "malachite-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 1 },
    ],
    defense: 1,
  }),
  a("alloy-greaves", "Alloy Greaves", "legs", "armor-alloy", 2, {
    tierIcon: "yellow-greaves",
    pathIcon: "white-ore",
    cost: [
      { materialId: "malachite-ore", qty: 1 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 1 },
    ],
    defense: 0,
    effect: "Poison Resistance",
  }),

  // ----- Bone -----
  a("bone-helm", "Bone Helm", "head", "armor-bone", 0, {
    tierIcon: "yellow-helm",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-small", qty: 2 },
      { materialId: "ancient-bone", qty: 2 },
    ],
    defense: 1,
  }),
  a("bone-mail", "Bone Mail", "chest", "armor-bone", 1, {
    tierIcon: "yellow-mail",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-small", qty: 1 },
      { materialId: "ancient-bone", qty: 2 },
    ],
    defense: 0,
    effect: "Slugger",
  }),
  a("bone-greaves", "Bone Greaves", "legs", "armor-bone", 2, {
    tierIcon: "yellow-greaves",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-small", qty: 1 },
      { materialId: "ancient-bone", qty: 1 },
    ],
    defense: 1,
  }),

  // ----- Jagras -----
  a("jagras-helm", "Jagras Helm", "head", "armor-jagras", 0, {
    tierIcon: "green-helm",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "ancient-bone", qty: 1 },
    ],
    defense: 1,
    effect: "Speed Eating",
  }),
  a("jagras-mail", "Jagras Mail", "chest", "armor-jagras", 1, {
    tierIcon: "green-mail",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "great-jagras-scale", qty: 1 },
      { materialId: "great-jagras-mane", qty: 1 },
      { materialId: "monster-bone-small", qty: 1 },
    ],
    defense: 1,
    effect: "Palico Rally",
  }),
  a("jagras-greaves", "Jagras Greaves", "legs", "armor-jagras", 2, {
    tierIcon: "green-greaves",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-scale", qty: 1 },
      { materialId: "great-jagras-mane", qty: 1 },
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "great-jagras-claw", qty: 1 },
    ],
    defense: 1,
  }),

  // ----- Kadachi -----
  a("kadachi-helm", "Kadachi Helm", "head", "armor-kadachi", 0, {
    tierIcon: "green-helm",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-pelt", qty: 1 },
      { materialId: "tobi-kadachi-claw", qty: 1 },
      { materialId: "electro-sac", qty: 1 },
    ],
    defense: 0,
    effect: "Constitution",
  }),
  a("kadachi-mail", "Kadachi Mail", "chest", "armor-kadachi", 1, {
    tierIcon: "green-mail",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-pelt", qty: 1 },
      { materialId: "tobi-kadachi-electrode", qty: 1 },
      { materialId: "tobi-kadachi-membrane", qty: 1 },
      { materialId: "wingdrake-hide", qty: 1 },
    ],
    defense: 1,
    effect: "Evade Extender",
  }),
  a("kadachi-greaves", "Kadachi Greaves", "legs", "armor-kadachi", 2, {
    tierIcon: "green-greaves",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-scale", qty: 2 },
      { materialId: "tobi-kadachi-pelt", qty: 1 },
      { materialId: "warm-pelt", qty: 1 },
    ],
    defense: 0,
    effect: "Thunder Attack",
  }),

  // ----- Anja -----
  a("anja-helm", "Anja Helm", "head", "armor-anja", 0, {
    tierIcon: "green-helm",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-pelt", qty: 1 },
      { materialId: "anjanath-scale", qty: 1 },
      { materialId: "anjanath-tail", qty: 1 },
    ],
    defense: 1,
    effect: "Fire Attack",
  }),
  a("anja-mail", "Anja Mail", "chest", "armor-anja", 1, {
    tierIcon: "green-mail",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-pelt", qty: 1 },
      { materialId: "anjanath-fang", qty: 1 },
      { materialId: "anjanath-nosebone", qty: 1 },
    ],
    defense: 1,
    effect: "Marathon Runner",
  }),
  a("anja-greaves", "Anja Greaves", "legs", "armor-anja", 2, {
    tierIcon: "green-greaves",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-scale", qty: 1 },
      { materialId: "anjanath-pelt", qty: 1 },
      { materialId: "flame-sac", qty: 1 },
      { materialId: "malachite-ore", qty: 2 },
    ],
    defense: 1,
  }),

  // ----- Rathalos -----
  a("rathalos-helm", "Rathalos Helm", "head", "armor-rathalos", 0, {
    tierIcon: "purple-helm",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 1 },
      { materialId: "rathalos-shell", qty: 1 },
      { materialId: "rathalos-marrow", qty: 1 },
    ],
    defense: 2,
    effect: "Set Bonus: Rathalos Mastery",
  }),
  a("rathalos-mail", "Rathalos Mail", "chest", "armor-rathalos", 1, {
    tierIcon: "purple-mail",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 1 },
      { materialId: "rathalos-webbing", qty: 1 },
      { materialId: "rathalos-plate", qty: 1 },
    ],
    defense: 1,
    effect: "Rathalos Power",
  }),
  a("rathalos-greaves", "Rathalos Greaves", "legs", "armor-rathalos", 2, {
    tierIcon: "purple-greaves",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-shell", qty: 1 },
      { materialId: "rathalos-wingtalon", qty: 1 },
      { materialId: "rathalos-tail", qty: 1 },
    ],
    defense: 1,
    effect: "Sleep Resistance",
  }),

  // ----- Rath Soul -----
  a("rath-soul-helm", "Rath Soul Helm", "head", "armor-rath-soul", 0, {
    tierIcon: "purple-helm",
    pathIcon: "azure-rathalos",
    cost: [
      { materialId: "azure-rathalos-scale", qty: 1 },
      { materialId: "azure-rathalos-carapace", qty: 1 },
      { materialId: "azure-rathalos-marrow", qty: 1 },
    ],
    defense: 2,
    effect: "Intimidator",
  }),
  a("rath-soul-mail", "Rath Soul Mail", "chest", "armor-rath-soul", 1, {
    tierIcon: "purple-mail",
    pathIcon: "azure-rathalos",
    cost: [
      { materialId: "azure-rathalos-scale", qty: 1 },
      { materialId: "azure-rathalos-wing", qty: 2 },
      { materialId: "azure-rathalos-plate", qty: 1 },
    ],
    defense: 1,
    effect: "Set Bonus: Azure Rathalos Mastery",
  }),
  a("rath-soul-greaves", "Rath Soul Greaves", "legs", "armor-rath-soul", 2, {
    tierIcon: "purple-greaves",
    pathIcon: "azure-rathalos",
    cost: [
      { materialId: "azure-rathalos-carapace", qty: 1 },
      { materialId: "azure-rathalos-wingtalon", qty: 2 },
      { materialId: "azure-rathalos-tail", qty: 1 },
    ],
    defense: 1,
    effect: "Focus",
  }),
];

export const ancientForestArmorSets: ArmorForgeSet[] = [
  {
    id: "armor-alloy",
    label: "Alloy",
    icon: "white-ore",
    gearIds: ["alloy-helm", "alloy-mail", "alloy-greaves"],
  },
  {
    id: "armor-bone",
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-helm", "bone-mail", "bone-greaves"],
  },
  {
    id: "armor-jagras",
    label: "Jagras",
    icon: "jagras",
    gearIds: ["jagras-helm", "jagras-mail", "jagras-greaves"],
  },
  {
    id: "armor-kadachi",
    label: "Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["kadachi-helm", "kadachi-mail", "kadachi-greaves"],
  },
  {
    id: "armor-anja",
    label: "Anja",
    icon: "anjanath",
    gearIds: ["anja-helm", "anja-mail", "anja-greaves"],
  },
  {
    id: "armor-rathalos",
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["rathalos-helm", "rathalos-mail", "rathalos-greaves"],
  },
  {
    id: "armor-rath-soul",
    label: "Rath Soul",
    icon: "azure-rathalos",
    gearIds: ["rath-soul-helm", "rath-soul-mail", "rath-soul-greaves"],
  },
];
