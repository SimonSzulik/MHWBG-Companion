import type { Cost, DeckChanges, GearDef, WeaponForgePath, WeaponType } from "../../domain/types";

type W = WeaponType;

function w(
  id: string,
  name: string,
  weaponType: W,
  pathId: string,
  pathOrder: number,
  opts: {
    cost?: Cost[];
    tierIcon: string;
    pathIcon: string;
    isStarter?: boolean;
    deckChanges?: DeckChanges;
  },
): GearDef {
  return {
    id,
    name,
    slot: "weapon",
    weaponType,
    pathId,
    pathOrder,
    cost: opts.cost ?? [],
    tierIcon: opts.tierIcon,
    pathIcon: opts.pathIcon,
    isStarter: opts.isStarter,
    deckChanges: opts.deckChanges,
  };
}

const gs = "Great Sword" as W;
const sns = "Sword & Shield" as W;
const bow = "Bow" as W;
const db = "Dual Blades" as W;

/** Forge gear for Ancient Forest weapon reference cards. */
export const ancientForestWeaponGear: GearDef[] = [
  // ----- Great Sword -----
  w("buster-sword", "Buster Sword", gs, "gs-ore", 0, {
    tierIcon: "white-great-sword",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("buster-blade", "Buster Blade", gs, "gs-ore", 1, {
    tierIcon: "yellow-great-sword",
    pathIcon: "white-ore",
    cost: [
      { materialId: "dragonite-ore", qty: 1 },
      { materialId: "malachite-ore", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Jumping Slash"],
      add: ["2 Enhanced Jumping Slash"],
    },
  }),
  w("chrome-razor", "Chrome Razor", gs, "gs-ore", 2, {
    tierIcon: "green-great-sword",
    pathIcon: "white-ore",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 3 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
    deckChanges: {
      remove: ["2 Jumping Slash", "2 Wide Slash"],
      add: ["2 Enhanced Jumping Slash", "2 Heavy Slice"],
    },
  }),

  w("bone-blade", "Bone Blade", gs, "gs-bone", 0, {
    tierIcon: "white-great-sword",
    pathIcon: "yellow-bone",
    cost: [{ materialId: "monster-bone-small", qty: 1 }],
  }),
  w("bone-slasher", "Bone Slasher", gs, "gs-bone", 1, {
    tierIcon: "yellow-great-sword",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-large", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
      { materialId: "boulder-bone", qty: 1 },
    ],
    deckChanges: {
      remove: ["Any 1 Card"],
      add: ["1 Greater Sword Block"],
    },
  }),
  w("giant-jawblade", "Giant Jawblade", gs, "gs-bone", 2, {
    tierIcon: "green-great-sword",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-hardbone", qty: 2 },
      { materialId: "monster-keenbone", qty: 2 },
      { materialId: "quality-bone", qty: 3 },
    ],
    deckChanges: {
      remove: ["Any 1 Card", "4 Overhead Slam"],
      add: ["1 Greater Sword Block", "4 Enhanced Overhead Slam"],
    },
  }),

  w("jagras-blade", "Jagras Blade", gs, "gs-jagras", 1, {
    tierIcon: "green-great-sword",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-claw", qty: 2 },
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "great-jagras-scale", qty: 2 },
      { materialId: "sharp-claw", qty: 1 },
    ],
    deckChanges: {
      remove: ["3 Rising Slash"],
      add: ["3 Strong Rising Slash"],
    },
  }),
  w("jagras-hacker", "Jagras Hacker", gs, "gs-jagras", 2, {
    tierIcon: "purple-great-sword",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-scale", qty: 2 },
      { materialId: "great-jagras-claw", qty: 2 },
      { materialId: "great-jagras-mane", qty: 2 },
      { materialId: "piercing-claw", qty: 1 },
    ],
    deckChanges: {
      remove: ["3 Rising Slash", "Any 2 Cards"],
      add: ["3 Strong Rising Slash", "2 Strong Charge Up"],
    },
  }),

  w("flame-blade", "Flame Blade", gs, "gs-rathalos", 1, {
    tierIcon: "green-great-sword",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 2 },
      { materialId: "rathalos-webbing", qty: 2 },
      { materialId: "inferno-sac", qty: 1 },
      { materialId: "rathalos-marrow", qty: 1 },
    ],
    deckChanges: {
      remove: ["4 Overhead Slam"],
      add: ["4 Blazing Slam"],
    },
  }),
  w("red-wing", "Red Wing", gs, "gs-rathalos", 2, {
    tierIcon: "purple-great-sword",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 2 },
      { materialId: "rathalos-carapace", qty: 1 },
      { materialId: "rathalos-wing", qty: 1 },
      { materialId: "rathalos-medulla", qty: 1 },
    ],
    deckChanges: {
      remove: ["4 Overhead Slam", "2 Wide Slash"],
      add: ["4 Blazing Slam", "2 Crushing Slash"],
    },
  }),

  // ----- Sword & Shield -----
  w("hunters-knife", "Hunter's Knife", sns, "sns-ore", 0, {
    tierIcon: "white-sword-shield",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("steel-knife", "Steel Knife", sns, "sns-ore", 1, {
    tierIcon: "yellow-sword-shield",
    pathIcon: "white-ore",
    cost: [
      { materialId: "dragonite-ore", qty: 1 },
      { materialId: "malachite-ore", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Advancing Slash"],
      add: ["2 Enhanced Advancing Slash"],
    },
  }),
  w("chrome-slicer", "Chrome Slicer", sns, "sns-ore", 2, {
    tierIcon: "green-sword-shield",
    pathIcon: "white-ore",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 3 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
    deckChanges: {
      remove: ["2 Advancing Slash", "Any 2 Cards"],
      add: ["2 Enhanced Advancing Slash", "2 Helm Splitter"],
    },
  }),

  w("bone-kukri", "Bone Kukri", sns, "sns-bone", 0, {
    tierIcon: "white-sword-shield",
    pathIcon: "yellow-bone",
    cost: [{ materialId: "monster-bone-small", qty: 1 }],
  }),
  w("chief-kukri", "Chief Kukri", sns, "sns-bone", 1, {
    tierIcon: "yellow-sword-shield",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-large", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
      { materialId: "boulder-bone", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Shield Bash"],
      add: ["2 Strong Shield Bash"],
    },
  }),
  w("grand-barong", "Grand Barong", sns, "sns-bone", 2, {
    tierIcon: "green-sword-shield",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-hardbone", qty: 2 },
      { materialId: "monster-keenbone", qty: 2 },
      { materialId: "quality-bone", qty: 3 },
    ],
    deckChanges: {
      remove: ["2 Shield Bash", "2 Chop"],
      add: ["2 Strong Shield Bash", "2 Chop Reversal"],
    },
  }),

  w("jagras-edge", "Jagras Edge", sns, "sns-jagras", 1, {
    tierIcon: "green-sword-shield",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-claw", qty: 2 },
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "great-jagras-scale", qty: 2 },
      { materialId: "sharp-claw", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Lateral Slash"],
      add: ["2 Glutton Lateral Slash"],
    },
  }),
  w("jagras-garrotte", "Jagras Garotte", sns, "sns-jagras", 2, {
    tierIcon: "purple-sword-shield",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-scale", qty: 3 },
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "great-jagras-mane", qty: 2 },
      { materialId: "piercing-claw", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Lateral Slash", "1 Rising Slash", "Any 1 Card"],
      add: ["2 Glutton Lateral Slash", "2 Jump Rising Slash"],
    },
  }),

  w("flame-knife", "Flame Knife", sns, "sns-rathalos", 1, {
    tierIcon: "green-sword-shield",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 1 },
      { materialId: "rathalos-tail", qty: 2 },
      { materialId: "rathalos-plate", qty: 1 },
      { materialId: "inferno-sac", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Advancing Slash"],
      add: ["2 Advancing Double Slash"],
    },
  }),
  w("heat-edge", "Heat Edge", sns, "sns-rathalos", 2, {
    tierIcon: "purple-sword-shield",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 2 },
      { materialId: "rathalos-carapace", qty: 2 },
      { materialId: "rathalos-wing", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Advancing Slash", "2 Sword & Shield Combo"],
      add: ["2 Advancing Double Slash", "2 Blazing Combo"],
    },
  }),

  // ----- Bow -----
  w("iron-bow", "Iron Bow", bow, "bow-ore", 0, {
    tierIcon: "white-bow",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("steel-bow", "Steel Bow", bow, "bow-ore", 1, {
    tierIcon: "yellow-bow",
    pathIcon: "white-ore",
    cost: [
      { materialId: "dragonite-ore", qty: 1 },
      { materialId: "malachite-ore", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
    ],
    deckChanges: {
      remove: ["2 Feint"],
      add: ["2 Skilled Feint"],
    },
  }),
  w("alloy-bow", "Alloy Bow", bow, "bow-ore", 2, {
    tierIcon: "green-bow",
    pathIcon: "white-ore",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 3 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
    deckChanges: {
      remove: ["2 Feint", "3 Charged Shot"],
      add: ["2 Skilled Feint", "3 Enhanced Charged Shot"],
    },
  }),

  w("hunters-bow", "Hunter's Bow", bow, "bow-bone", 0, {
    tierIcon: "white-bow",
    pathIcon: "yellow-bone",
    cost: [{ materialId: "monster-bone-small", qty: 1 }],
  }),
  w("hunters-stoutbow", "Hunter's Stoutbow", bow, "bow-bone", 1, {
    tierIcon: "yellow-bow",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-large", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
      { materialId: "boulder-bone", qty: 1 },
    ],
    deckChanges: {
      remove: ["4 Power Coating"],
      add: ["2 Poison Coating", "2 Paralysis Coating"],
    },
  }),
  w("hunters-proudbow", "Hunter's Proudbow", bow, "bow-bone", 2, {
    tierIcon: "green-bow",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-hardbone", qty: 2 },
      { materialId: "monster-keenbone", qty: 2 },
      { materialId: "quality-bone", qty: 3 },
    ],
    deckChanges: {
      remove: ["4 Power Coating", "2 Shot", "2 Arc Shot"],
      add: [
        "2 Poison Coating",
        "2 Paralysis Coating",
        "2 Enhanced Shot",
        "2 Strong Arc Shot",
      ],
    },
  }),

  w("pulsar-bow", "Pulsar Bow", bow, "bow-tobi", 1, {
    tierIcon: "green-bow",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-electrode", qty: 2 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "electro-sac", qty: 1 },
      { materialId: "coral-crystal", qty: 2 },
    ],
    deckChanges: {
      remove: ["4 Power Coating"],
      add: ["3 High Power Coating", "1 Paralysis Coating"],
    },
  }),
  w("flying-kadachi-strikebow", "Flying Kadachi Strikebow", bow, "bow-tobi", 2, {
    tierIcon: "purple-bow",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "tobi-kadachi-scale", qty: 2 },
      { materialId: "tobi-kadachi-pelt", qty: 2 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
    deckChanges: {
      remove: ["4 Power Coating", "1 Dragon Piercer", "Any 1 Card"],
      add: [
        "3 High Power Coating",
        "1 Paralysis Coating",
        "2 Striking Dragon Piercer",
      ],
    },
  }),

  w("blazing-bow", "Blazing Bow", bow, "bow-anja", 1, {
    tierIcon: "green-bow",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-scale", qty: 3 },
      { materialId: "anjanath-fang", qty: 2 },
      { materialId: "flame-sac", qty: 1 },
    ],
    deckChanges: {
      remove: ["4 Power Coating"],
      add: ["2 Blast Coating", "2 Poison Coating"],
    },
  }),
  w("anja-arch", "Anja Arch", bow, "bow-anja", 2, {
    tierIcon: "purple-bow",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-fang", qty: 4 },
      { materialId: "anjanath-pelt", qty: 4 },
      { materialId: "anjanath-scale", qty: 3 },
      { materialId: "flame-sac", qty: 2 },
    ],
    deckChanges: {
      remove: ["4 Power Coating", "3 Charged Shot"],
      add: [
        "2 Blast Coating",
        "2 Poison Coating",
        "3 Blazing Charged Shot",
      ],
    },
  }),

  // ----- Dual Blades -----
  w("matched-slicers", "Matched Slicers", db, "db-ore", 0, {
    tierIcon: "white-dual-blades",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("dual-slicers", "Dual Slicers", db, "db-ore", 1, {
    tierIcon: "yellow-dual-blades",
    pathIcon: "white-ore",
    cost: [
      { materialId: "dragonite-ore", qty: 1 },
      { materialId: "malachite-ore", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
    ],
  }),
  w("chrome-slicers", "Chrome Slicers", db, "db-ore", 2, {
    tierIcon: "green-dual-blades",
    pathIcon: "white-ore",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "carbalite-ore", qty: 2 },
      { materialId: "dragonite-ore", qty: 3 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
  }),

  w("bone-hatchets", "Bone Hatchets", db, "db-bone", 0, {
    tierIcon: "white-dual-blades",
    pathIcon: "yellow-bone",
    cost: [{ materialId: "monster-bone-small", qty: 1 }],
  }),
  w("wild-hatchets", "Wild Hatchets", db, "db-bone", 1, {
    tierIcon: "yellow-dual-blades",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-bone-large", qty: 1 },
      { materialId: "monster-bone-medium", qty: 1 },
      { materialId: "boulder-bone", qty: 1 },
    ],
  }),
  w("strong-hatchets", "Strong Hatchets", db, "db-bone", 2, {
    tierIcon: "green-dual-blades",
    pathIcon: "yellow-bone",
    cost: [
      { materialId: "monster-hardbone", qty: 2 },
      { materialId: "monster-keenbone", qty: 2 },
      { materialId: "quality-bone", qty: 3 },
    ],
  }),

  w("pulsar-hatchets", "Pulsar Hatchets", db, "db-tobi", 1, {
    tierIcon: "green-dual-blades",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-electrode", qty: 1 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "electro-sac", qty: 2 },
      { materialId: "coral-crystal", qty: 2 },
    ],
  }),
  w("kadachi-claws", "Kadachi Claws", db, "db-tobi", 2, {
    tierIcon: "purple-dual-blades",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-electrode", qty: 2 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "thunder-sac", qty: 1 },
    ],
  }),

  w("blazing-hatchets", "Blazing Hatchets", db, "db-anja", 1, {
    tierIcon: "green-dual-blades",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-scale", qty: 3 },
      { materialId: "anjanath-fang", qty: 2 },
      { materialId: "flame-sac", qty: 1 },
    ],
  }),
  w("anja-cyclone", "Anja Cyclone", db, "db-anja", 2, {
    tierIcon: "purple-dual-blades",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-fang", qty: 4 },
      { materialId: "anjanath-pelt", qty: 4 },
      { materialId: "firecell-stone", qty: 2 },
    ],
  }),
];

export const ancientForestWeaponPaths: WeaponForgePath[] = [
  {
    id: "gs-ore",
    weaponType: gs,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["buster-sword", "buster-blade", "chrome-razor"],
  },
  {
    id: "gs-bone",
    weaponType: gs,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-blade", "bone-slasher", "giant-jawblade"],
  },
  {
    id: "gs-jagras",
    weaponType: gs,
    label: "Jagras",
    icon: "jagras",
    gearIds: ["buster-sword", "jagras-blade", "jagras-hacker"],
  },
  {
    id: "gs-rathalos",
    weaponType: gs,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["buster-sword", "flame-blade", "red-wing"],
  },

  {
    id: "sns-ore",
    weaponType: sns,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["hunters-knife", "steel-knife", "chrome-slicer"],
  },
  {
    id: "sns-bone",
    weaponType: sns,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-kukri", "chief-kukri", "grand-barong"],
  },
  {
    id: "sns-jagras",
    weaponType: sns,
    label: "Jagras",
    icon: "jagras",
    gearIds: ["bone-kukri", "jagras-edge", "jagras-garrotte"],
  },
  {
    id: "sns-rathalos",
    weaponType: sns,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["hunters-knife", "flame-knife", "heat-edge"],
  },

  {
    id: "bow-ore",
    weaponType: bow,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["iron-bow", "steel-bow", "alloy-bow"],
  },
  {
    id: "bow-bone",
    weaponType: bow,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["hunters-bow", "hunters-stoutbow", "hunters-proudbow"],
  },
  {
    id: "bow-tobi",
    weaponType: bow,
    label: "Tobi-Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["hunters-bow", "pulsar-bow", "flying-kadachi-strikebow"],
  },
  {
    id: "bow-anja",
    weaponType: bow,
    label: "Anjanath",
    icon: "anjanath",
    gearIds: ["hunters-bow", "blazing-bow", "anja-arch"],
  },

  {
    id: "db-ore",
    weaponType: db,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["matched-slicers", "dual-slicers", "chrome-slicers"],
  },
  {
    id: "db-bone",
    weaponType: db,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-hatchets", "wild-hatchets", "strong-hatchets"],
  },
  {
    id: "db-tobi",
    weaponType: db,
    label: "Tobi-Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["bone-hatchets", "pulsar-hatchets", "kadachi-claws"],
  },
  {
    id: "db-anja",
    weaponType: db,
    label: "Anjanath",
    icon: "anjanath",
    gearIds: ["bone-hatchets", "blazing-hatchets", "anja-cyclone"],
  },
];

export const FORGE_WEAPON_TYPES: WeaponType[] = [gs, sns, bow, db];
