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
const ls = "Long Sword" as W;
const ham = "Hammer" as W;
const gl = "Gunlance" as W;
const lbg = "Light Bowgun" as W;
const lance = "Lance" as W;
const hh = "Hunting Horn" as W;

// Fixed ore/bone tier costs — identical across every weapon type in the box.
const YELLOW_ORE: Cost[] = [
  { materialId: "dragonite-ore", qty: 1 },
  { materialId: "malachite-ore", qty: 1 },
  { materialId: "monster-bone-medium", qty: 1 },
];
const GREEN_ORE: Cost[] = [
  { materialId: "fucium-ore", qty: 2 },
  { materialId: "carbalite-ore", qty: 2 },
  { materialId: "dragonite-ore", qty: 3 },
  { materialId: "dragonvein-crystal", qty: 2 },
];
const WHITE_BONE: Cost[] = [{ materialId: "monster-bone-small", qty: 1 }];
const YELLOW_BONE: Cost[] = [
  { materialId: "monster-bone-large", qty: 1 },
  { materialId: "monster-bone-medium", qty: 1 },
  { materialId: "boulder-bone", qty: 1 },
];
const GREEN_BONE: Cost[] = [
  { materialId: "monster-hardbone", qty: 2 },
  { materialId: "monster-keenbone", qty: 2 },
  { materialId: "quality-bone", qty: 3 },
];
// Shared monster-tier costs (transcribed from the Ancient Forest forge cards).
const ANJA_GREEN: Cost[] = [
  { materialId: "anjanath-fang", qty: 2 },
  { materialId: "anjanath-scale", qty: 3 },
  { materialId: "flame-sac", qty: 1 },
];
const RATH_GREEN: Cost[] = [
  { materialId: "rathalos-scale", qty: 2 },
  { materialId: "rathalos-webbing", qty: 2 },
  { materialId: "inferno-sac", qty: 1 },
  { materialId: "rathalos-marrow", qty: 1 },
];
const RATH_PURPLE: Cost[] = [
  { materialId: "rathalos-scale", qty: 2 },
  { materialId: "rathalos-carapace", qty: 1 },
  { materialId: "rathalos-wing", qty: 1 },
  { materialId: "rathalos-medulla", qty: 1 },
];
// Wildspire Waste monster-tier costs (from the Wildspire forge cards).
const PUKEI_GREEN: Cost[] = [
  { materialId: "pukei-pukei-quill", qty: 2 },
  { materialId: "pukei-pukei-scale", qty: 2 },
  { materialId: "poison-sac", qty: 1 },
  { materialId: "pukei-pukei-tail", qty: 1 },
];
const PUKEI_PURPLE: Cost[] = [
  { materialId: "pukei-pukei-scale", qty: 2 },
  { materialId: "pukei-pukei-wing", qty: 2 },
  { materialId: "toxin-sac", qty: 2 },
  { materialId: "quality-bone", qty: 3 },
];
const BARROTH_GREEN: Cost[] = [
  { materialId: "barroth-claw", qty: 1 },
  { materialId: "barroth-shell", qty: 3 },
  { materialId: "barroth-ridge", qty: 3 },
];
const BARROTH_PURPLE: Cost[] = [
  { materialId: "barroth-claw", qty: 2 },
  { materialId: "barroth-carapace", qty: 3 },
  { materialId: "barroth-ridge", qty: 3 },
];
const DIABLOS_GREEN: Cost[] = [
  { materialId: "twisted-horn", qty: 1 },
  { materialId: "diablos-fang", qty: 2 },
  { materialId: "diablos-shell", qty: 4 },
  { materialId: "monster-bone-large", qty: 2 },
];
const DIABLOS_PURPLE: Cost[] = [
  { materialId: "majestic-horn", qty: 2 },
  { materialId: "diablos-carapace", qty: 2 },
  { materialId: "diablos-ridge", qty: 2 },
  { materialId: "blos-medulla", qty: 1 },
];

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

  // ===== Wildspire Waste paths (Pukei-Pukei, Barroth, Diablos, Jyuratodus) =====
  // ----- Great Sword -----
  w("blooming-blade", "Blooming Blade", gs, "gs-pukei", 1, {
    tierIcon: "green-great-sword",
    pathIcon: "pukei-pukei",
    cost: PUKEI_GREEN,
  }),
  w("datura-blaze", "Datura Blaze", gs, "gs-pukei", 2, {
    tierIcon: "purple-great-sword",
    pathIcon: "pukei-pukei",
    cost: PUKEI_PURPLE,
  }),
  w("carapace-buster", "Carapace Buster", gs, "gs-barroth", 1, {
    tierIcon: "green-great-sword",
    pathIcon: "barroth",
    cost: BARROTH_GREEN,
  }),
  w("barroth-shredder", "Barroth Shredder", gs, "gs-barroth", 2, {
    tierIcon: "purple-great-sword",
    pathIcon: "barroth",
    cost: BARROTH_PURPLE,
  }),

  // ----- Sword & Shield -----
  w("blooming-knife", "Blooming Knife", sns, "sns-pukei", 1, {
    tierIcon: "green-sword-shield",
    pathIcon: "pukei-pukei",
    cost: PUKEI_GREEN,
  }),
  w("datura-blossom", "Datura Blossom", sns, "sns-pukei", 2, {
    tierIcon: "purple-sword-shield",
    pathIcon: "pukei-pukei",
    cost: PUKEI_PURPLE,
  }),
  w("carapace-edge", "Carapace Edge", sns, "sns-barroth", 1, {
    tierIcon: "green-sword-shield",
    pathIcon: "barroth",
    cost: BARROTH_GREEN,
  }),
  w("barroth-club", "Barroth Club", sns, "sns-barroth", 2, {
    tierIcon: "purple-sword-shield",
    pathIcon: "barroth",
    cost: BARROTH_PURPLE,
  }),

  // ----- Bow -----
  w("blooming-arch", "Blooming Arch", bow, "bow-pukei", 1, {
    tierIcon: "green-bow",
    pathIcon: "pukei-pukei",
    cost: PUKEI_GREEN,
  }),
  w("datura-string", "Datura String", bow, "bow-pukei", 2, {
    tierIcon: "purple-bow",
    pathIcon: "pukei-pukei",
    cost: PUKEI_PURPLE,
  }),
  w("diablos-bow", "Diablos Bow", bow, "bow-diablos", 1, {
    tierIcon: "green-bow",
    pathIcon: "diablos",
    cost: DIABLOS_GREEN,
  }),
  w("diablos-coilbender", "Diablos Coilbender", bow, "bow-diablos", 2, {
    tierIcon: "purple-bow",
    pathIcon: "diablos",
    cost: DIABLOS_PURPLE,
  }),

  // ----- Dual Blades -----
  w("madness-pangas", "Madness Pangas", db, "db-jyura", 1, {
    tierIcon: "green-dual-blades",
    pathIcon: "jyuratodus",
    cost: [
      { materialId: "jyuratodus-fin", qty: 1 },
      { materialId: "jyuratodus-shell", qty: 2 },
      { materialId: "jyuratodus-scale", qty: 3 },
      { materialId: "aqua-sac", qty: 1 },
    ],
  }),
  w("jyura-hatchets", "Jyura Hatchets", db, "db-jyura", 2, {
    tierIcon: "purple-dual-blades",
    pathIcon: "jyuratodus",
    cost: [
      { materialId: "jyuratodus-fin", qty: 1 },
      { materialId: "jyuratodus-scale", qty: 2 },
      { materialId: "aqua-sac", qty: 2 },
      { materialId: "gajau-scale", qty: 1 },
    ],
  }),
  w("diablos-hatchets", "Diablos Hatchets", db, "db-diablos", 1, {
    tierIcon: "green-dual-blades",
    pathIcon: "diablos",
    cost: DIABLOS_GREEN,
  }),
  w("diablos-clubs", "Diablos Clubs", db, "db-diablos", 2, {
    tierIcon: "purple-dual-blades",
    pathIcon: "diablos",
    cost: DIABLOS_PURPLE,
  }),

  // ----- Long Sword -----
  w("iron-katana", "Iron Katana", ls, "ls-ore", 0, {
    tierIcon: "white-long-sword",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("iron-grace", "Iron Grace", ls, "ls-ore", 1, {
    tierIcon: "yellow-long-sword",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("iron-gospel", "Iron Gospel", ls, "ls-ore", 2, {
    tierIcon: "green-long-sword",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("bone-shotel", "Bone Shotel", ls, "ls-bone", 0, {
    tierIcon: "white-long-sword",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("hard-bone-shotel", "Hard Bone Shotel", ls, "ls-bone", 1, {
    tierIcon: "yellow-long-sword",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("bone-reaper", "Bone Reaper", ls, "ls-bone", 2, {
    tierIcon: "green-long-sword",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("blazing-shotel", "Blazing Shotel", ls, "ls-anja", 1, {
    tierIcon: "green-long-sword",
    pathIcon: "anjanath",
    cost: ANJA_GREEN,
  }),
  w("anja-scimitar", "Anja Scimitar", ls, "ls-anja", 2, {
    tierIcon: "purple-long-sword",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-fang", qty: 2 },
      { materialId: "anjanath-scale", qty: 2 },
      { materialId: "inferno-sac", qty: 2 },
    ],
  }),
  w("pulsar-shotel", "Pulsar Shotel", ls, "ls-tobi", 1, {
    tierIcon: "green-long-sword",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-claw", qty: 1 },
      { materialId: "tobi-kadachi-pelt", qty: 3 },
      { materialId: "tobi-kadachi-scale", qty: 2 },
    ],
  }),
  w("kadachi-fang", "Kadachi Fang", ls, "ls-tobi", 2, {
    tierIcon: "purple-long-sword",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-claw", qty: 3 },
      { materialId: "tobi-kadachi-pelt", qty: 1 },
      { materialId: "dragonvein-crystal", qty: 2 },
    ],
  }),
  w("wyvern-blade-fall", 'Wyvern Blade "Fall"', ls, "ls-rathalos", 1, {
    tierIcon: "green-long-sword",
    pathIcon: "rathalos",
    cost: RATH_GREEN,
  }),
  w("wyvern-blade-blood", 'Wyvern Blade "Blood"', ls, "ls-rathalos", 2, {
    tierIcon: "purple-long-sword",
    pathIcon: "rathalos",
    cost: RATH_PURPLE,
  }),

  // ----- Hammer -----
  w("iron-hammer", "Iron Hammer", ham, "ham-ore", 0, {
    tierIcon: "white-hammer",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("iron-demon", "Iron Demon", ham, "ham-ore", 1, {
    tierIcon: "yellow-hammer",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("iron-arch-demon", "Iron Arch Demon", ham, "ham-ore", 2, {
    tierIcon: "green-hammer",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("bone-bludgeon", "Bone Bludgeon", ham, "ham-bone", 0, {
    tierIcon: "white-hammer",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("fossil-bludgeon", "Fossil Bludgeon", ham, "ham-bone", 1, {
    tierIcon: "yellow-hammer",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("grand-rock", "Grand Rock", ham, "ham-bone", 2, {
    tierIcon: "green-hammer",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("blazing-hammer", "Blazing Hammer", ham, "ham-anja", 1, {
    tierIcon: "green-hammer",
    pathIcon: "anjanath",
    cost: ANJA_GREEN,
  }),
  w("anja-striker", "Anja Striker", ham, "ham-anja", 2, {
    tierIcon: "purple-hammer",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-fang", qty: 4 },
      { materialId: "anjanath-scale", qty: 2 },
      { materialId: "inferno-sac", qty: 1 },
    ],
  }),

  // ----- Gunlance -----
  w("iron-gunlance", "Iron Gunlance", gl, "gl-ore", 0, {
    tierIcon: "white-gunlance",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("steel-gunlance", "Steel Gunlance", gl, "gl-ore", 1, {
    tierIcon: "yellow-gunlance",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("chrome-gunlance", "Chrome Gunlance", gl, "gl-ore", 2, {
    tierIcon: "green-gunlance",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("bone-gunlance", "Bone Gunlance", gl, "gl-bone", 0, {
    tierIcon: "white-gunlance",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("bone-cannon", "Bone Cannon", gl, "gl-bone", 1, {
    tierIcon: "yellow-gunlance",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("great-bone-gunlance", "Great Bone Gunlance", gl, "gl-bone", 2, {
    tierIcon: "green-gunlance",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("jagras-gunlance", "Jagras Gunlance", gl, "gl-jagras", 1, {
    tierIcon: "green-gunlance",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "great-jagras-scale", qty: 3 },
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "sharp-claw", qty: 1 },
    ],
  }),
  w("glutton-gunlance", "Glutton Gunlance", gl, "gl-jagras", 2, {
    tierIcon: "purple-gunlance",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-scale", qty: 2 },
      { materialId: "great-jagras-mane", qty: 2 },
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "piercing-claw", qty: 1 },
    ],
  }),
  w("rath-gunlance", "Rath Gunlance", gl, "gl-rathalos", 1, {
    tierIcon: "green-gunlance",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 2 },
      { materialId: "rathalos-webbing", qty: 1 },
      { materialId: "inferno-sac", qty: 1 },
      { materialId: "rathalos-marrow", qty: 2 },
    ],
  }),
  w("red-rook", "Red Rook", gl, "gl-rathalos", 2, {
    tierIcon: "purple-gunlance",
    pathIcon: "rathalos",
    cost: RATH_PURPLE,
  }),

  // ----- Light Bowgun -----
  w("chain-blitz", "Chain Blitz", lbg, "lbg-ore", 0, {
    tierIcon: "white-light-bowgun",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("high-chain-blitz", "High Chain Blitz", lbg, "lbg-ore", 1, {
    tierIcon: "yellow-light-bowgun",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("cross-blitz", "Cross Blitz", lbg, "lbg-ore", 2, {
    tierIcon: "green-light-bowgun",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("hunters-rifle", "Hunter's Rifle", lbg, "lbg-bone", 0, {
    tierIcon: "white-light-bowgun",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("power-rifle", "Power Rifle", lbg, "lbg-bone", 1, {
    tierIcon: "yellow-light-bowgun",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("sniper-shot", "Sniper Shot", lbg, "lbg-bone", 2, {
    tierIcon: "green-light-bowgun",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("jagras-blitz", "Jagras Blitz", lbg, "lbg-jagras", 1, {
    tierIcon: "green-light-bowgun",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "great-jagras-scale", qty: 3 },
      { materialId: "great-jagras-hide", qty: 1 },
      { materialId: "sharp-claw", qty: 1 },
    ],
  }),
  w("jagras-fire", "Jagras Fire", lbg, "lbg-jagras", 2, {
    tierIcon: "purple-light-bowgun",
    pathIcon: "jagras",
    cost: [
      { materialId: "great-jagras-scale", qty: 3 },
      { materialId: "great-jagras-mane", qty: 2 },
      { materialId: "great-jagras-claw", qty: 1 },
      { materialId: "piercing-claw", qty: 1 },
    ],
  }),
  w("flame-blitz", "Flame Blitz", lbg, "lbg-rathalos", 1, {
    tierIcon: "green-light-bowgun",
    pathIcon: "rathalos",
    cost: [
      { materialId: "rathalos-scale", qty: 2 },
      { materialId: "rathalos-webbing", qty: 1 },
      { materialId: "inferno-sac", qty: 1 },
      { materialId: "rathalos-marrow", qty: 1 },
    ],
  }),
  w("rathbuster", "Rathbuster", lbg, "lbg-rathalos", 2, {
    tierIcon: "purple-light-bowgun",
    pathIcon: "rathalos",
    cost: RATH_PURPLE,
  }),

  // ----- Lance -----
  w("iron-lance", "Iron Lance", lance, "lance-ore", 0, {
    tierIcon: "white-lance",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("steel-lance", "Steel Lance", lance, "lance-ore", 1, {
    tierIcon: "yellow-lance",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("chrome-lance", "Chrome Lance", lance, "lance-ore", 2, {
    tierIcon: "green-lance",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("bone-lance", "Bone Lance", lance, "lance-bone", 0, {
    tierIcon: "white-lance",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("hard-bone-lance", "Hard Bone Lance", lance, "lance-bone", 1, {
    tierIcon: "yellow-lance",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("heavy-bone-lance", "Heavy Bone Lance", lance, "lance-bone", 2, {
    tierIcon: "green-lance",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("thunder-lance", "Thunder Lance", lance, "lance-tobi", 1, {
    tierIcon: "green-lance",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "tobi-kadachi-electrode", qty: 1 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "electro-sac", qty: 2 },
      { materialId: "coral-crystal", qty: 2 },
    ],
  }),
  w("lightning-spire", "Lightning Spire", lance, "lance-tobi", 2, {
    tierIcon: "purple-lance",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "tobi-kadachi-electrode", qty: 2 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "thunder-sac", qty: 1 },
    ],
  }),
  w("flame-lance", "Flame Lance", lance, "lance-rathalos", 1, {
    tierIcon: "green-lance",
    pathIcon: "rathalos",
    cost: RATH_GREEN,
  }),
  w("red-tail", "Red Tail", lance, "lance-rathalos", 2, {
    tierIcon: "purple-lance",
    pathIcon: "rathalos",
    cost: RATH_PURPLE,
  }),

  // ----- Hunting Horn -----
  w("metal-bagpipe", "Metal Bagpipe", hh, "hh-ore", 0, {
    tierIcon: "white-hunting-horn",
    pathIcon: "white-ore",
    isStarter: true,
  }),
  w("great-bagpipe", "Great Bagpipe", hh, "hh-ore", 1, {
    tierIcon: "yellow-hunting-horn",
    pathIcon: "white-ore",
    cost: YELLOW_ORE,
  }),
  w("fortissimo", "Fortissimo", hh, "hh-ore", 2, {
    tierIcon: "green-hunting-horn",
    pathIcon: "white-ore",
    cost: GREEN_ORE,
  }),
  w("bone-horn", "Bone Horn", hh, "hh-bone", 0, {
    tierIcon: "white-hunting-horn",
    pathIcon: "yellow-bone",
    cost: WHITE_BONE,
  }),
  w("hard-bone-horn", "Hard Bone Horn", hh, "hh-bone", 1, {
    tierIcon: "yellow-hunting-horn",
    pathIcon: "yellow-bone",
    cost: YELLOW_BONE,
  }),
  w("heavy-bone-horn", "Heavy Bone Horn", hh, "hh-bone", 2, {
    tierIcon: "green-hunting-horn",
    pathIcon: "yellow-bone",
    cost: GREEN_BONE,
  }),
  w("blazing-horn", "Blazing Horn", hh, "hh-anja", 1, {
    tierIcon: "green-hunting-horn",
    pathIcon: "anjanath",
    cost: ANJA_GREEN,
  }),
  w("anja-barone", "Anja Barone", hh, "hh-anja", 2, {
    tierIcon: "purple-hunting-horn",
    pathIcon: "anjanath",
    cost: [
      { materialId: "anjanath-fang", qty: 4 },
      { materialId: "anjanath-pelt", qty: 4 },
      { materialId: "firecell-stone", qty: 2 },
    ],
  }),
  w("thunder-gaida", "Thunder Gaida", hh, "hh-tobi", 1, {
    tierIcon: "green-hunting-horn",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "dragonite-ore", qty: 2 },
      { materialId: "tobi-kadachi-electrode", qty: 1 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "coral-crystal", qty: 2 },
      { materialId: "electro-sac", qty: 2 },
    ],
  }),
  w("lightning-drum", "Lightning Drum", hh, "hh-tobi", 2, {
    tierIcon: "purple-hunting-horn",
    pathIcon: "tobi-kadachi",
    cost: [
      { materialId: "fucium-ore", qty: 2 },
      { materialId: "tobi-kadachi-electrode", qty: 2 },
      { materialId: "tobi-kadachi-claw", qty: 2 },
      { materialId: "thunder-sac", qty: 1 },
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

  // ===== Wildspire Waste paths =====
  {
    id: "gs-pukei",
    weaponType: gs,
    label: "Pukei-Pukei",
    icon: "pukei-pukei",
    gearIds: ["buster-sword", "blooming-blade", "datura-blaze"],
  },
  {
    id: "gs-barroth",
    weaponType: gs,
    label: "Barroth",
    icon: "barroth",
    gearIds: ["buster-sword", "carapace-buster", "barroth-shredder"],
  },
  {
    id: "sns-pukei",
    weaponType: sns,
    label: "Pukei-Pukei",
    icon: "pukei-pukei",
    gearIds: ["hunters-knife", "blooming-knife", "datura-blossom"],
  },
  {
    id: "sns-barroth",
    weaponType: sns,
    label: "Barroth",
    icon: "barroth",
    gearIds: ["hunters-knife", "carapace-edge", "barroth-club"],
  },
  {
    id: "bow-pukei",
    weaponType: bow,
    label: "Pukei-Pukei",
    icon: "pukei-pukei",
    gearIds: ["iron-bow", "blooming-arch", "datura-string"],
  },
  {
    id: "bow-diablos",
    weaponType: bow,
    label: "Diablos",
    icon: "diablos",
    gearIds: ["iron-bow", "diablos-bow", "diablos-coilbender"],
  },
  {
    id: "db-jyura",
    weaponType: db,
    label: "Jyuratodus",
    icon: "jyuratodus",
    gearIds: ["matched-slicers", "madness-pangas", "jyura-hatchets"],
  },
  {
    id: "db-diablos",
    weaponType: db,
    label: "Diablos",
    icon: "diablos",
    gearIds: ["matched-slicers", "diablos-hatchets", "diablos-clubs"],
  },

  // ----- Long Sword -----
  {
    id: "ls-ore",
    weaponType: ls,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["iron-katana", "iron-grace", "iron-gospel"],
  },
  {
    id: "ls-bone",
    weaponType: ls,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-shotel", "hard-bone-shotel", "bone-reaper"],
  },
  {
    id: "ls-anja",
    weaponType: ls,
    label: "Anjanath",
    icon: "anjanath",
    gearIds: ["iron-katana", "blazing-shotel", "anja-scimitar"],
  },
  {
    id: "ls-tobi",
    weaponType: ls,
    label: "Tobi-Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["iron-katana", "pulsar-shotel", "kadachi-fang"],
  },
  {
    id: "ls-rathalos",
    weaponType: ls,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["iron-katana", "wyvern-blade-fall", "wyvern-blade-blood"],
  },

  // ----- Hammer -----
  {
    id: "ham-ore",
    weaponType: ham,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["iron-hammer", "iron-demon", "iron-arch-demon"],
  },
  {
    id: "ham-bone",
    weaponType: ham,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-bludgeon", "fossil-bludgeon", "grand-rock"],
  },
  {
    id: "ham-anja",
    weaponType: ham,
    label: "Anjanath",
    icon: "anjanath",
    gearIds: ["iron-hammer", "blazing-hammer", "anja-striker"],
  },

  // ----- Gunlance -----
  {
    id: "gl-ore",
    weaponType: gl,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["iron-gunlance", "steel-gunlance", "chrome-gunlance"],
  },
  {
    id: "gl-bone",
    weaponType: gl,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-gunlance", "bone-cannon", "great-bone-gunlance"],
  },
  {
    id: "gl-jagras",
    weaponType: gl,
    label: "Jagras",
    icon: "jagras",
    gearIds: ["iron-gunlance", "jagras-gunlance", "glutton-gunlance"],
  },
  {
    id: "gl-rathalos",
    weaponType: gl,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["iron-gunlance", "rath-gunlance", "red-rook"],
  },

  // ----- Light Bowgun -----
  {
    id: "lbg-ore",
    weaponType: lbg,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["chain-blitz", "high-chain-blitz", "cross-blitz"],
  },
  {
    id: "lbg-bone",
    weaponType: lbg,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["hunters-rifle", "power-rifle", "sniper-shot"],
  },
  {
    id: "lbg-jagras",
    weaponType: lbg,
    label: "Jagras",
    icon: "jagras",
    gearIds: ["chain-blitz", "jagras-blitz", "jagras-fire"],
  },
  {
    id: "lbg-rathalos",
    weaponType: lbg,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["chain-blitz", "flame-blitz", "rathbuster"],
  },

  // ----- Lance -----
  {
    id: "lance-ore",
    weaponType: lance,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["iron-lance", "steel-lance", "chrome-lance"],
  },
  {
    id: "lance-bone",
    weaponType: lance,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-lance", "hard-bone-lance", "heavy-bone-lance"],
  },
  {
    id: "lance-tobi",
    weaponType: lance,
    label: "Tobi-Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["iron-lance", "thunder-lance", "lightning-spire"],
  },
  {
    id: "lance-rathalos",
    weaponType: lance,
    label: "Rathalos",
    icon: "rathalos",
    gearIds: ["iron-lance", "flame-lance", "red-tail"],
  },

  // ----- Hunting Horn -----
  {
    id: "hh-ore",
    weaponType: hh,
    label: "Ore",
    icon: "white-ore",
    gearIds: ["metal-bagpipe", "great-bagpipe", "fortissimo"],
  },
  {
    id: "hh-bone",
    weaponType: hh,
    label: "Bone",
    icon: "yellow-bone",
    gearIds: ["bone-horn", "hard-bone-horn", "heavy-bone-horn"],
  },
  {
    id: "hh-anja",
    weaponType: hh,
    label: "Anjanath",
    icon: "anjanath",
    gearIds: ["metal-bagpipe", "blazing-horn", "anja-barone"],
  },
  {
    id: "hh-tobi",
    weaponType: hh,
    label: "Tobi-Kadachi",
    icon: "tobi-kadachi",
    gearIds: ["metal-bagpipe", "thunder-gaida", "lightning-drum"],
  },
];

export const FORGE_WEAPON_TYPES: WeaponType[] = [
  gs,
  sns,
  bow,
  db,
  ls,
  ham,
  gl,
  lbg,
  lance,
  hh,
];
