import type { GameData, Material } from "../domain/types";

/**
 * Ancient Forest — static catalog.
 *
 * Material IDs, names and icon types align with reDBo0n/mhwbg-comp items.json
 * (commons / others / monsters) for icon compatibility.
 */
export const ancientForest: GameData = {
  box: "Ancient Forest",

  materials: [
    // ----- Material (commons) -----
    { id: "carbalite-ore", name: "Carbalite Ore", group: "material", iconType: "white-ore" },
    { id: "malachite-ore", name: "Malachite Ore", group: "material", iconType: "white-ore" },
    { id: "dragonite-ore", name: "Dragonite Ore", group: "material", iconType: "white-ore" },
    { id: "fucium-ore", name: "Fucium Ore", group: "material", iconType: "white-ore" },
    { id: "quality-bone", name: "Quality Bone", group: "material", iconType: "white-bone" },
    { id: "monster-bone-small", name: "Monster Bone Small", group: "material", iconType: "white-bone" },
    { id: "monster-bone-medium", name: "Monster Bone Medium", group: "material", iconType: "white-bone" },
    { id: "monster-bone-large", name: "Monster Bone Large", group: "material", iconType: "white-bone" },
    { id: "monster-keenbone", name: "Monster Keenbone", group: "material", iconType: "white-bone" },
    { id: "monster-hardbone", name: "Monster Hardbone", group: "material", iconType: "white-bone" },
    { id: "ancient-bone", name: "Ancient Bone", group: "material", iconType: "white-bone" },
    { id: "boulder-bone", name: "Boulder Bone", group: "material", iconType: "white-bone" },
    { id: "dragonvein-crystal", name: "Dragonvein Crystal", group: "material", iconType: "white-gem" },
    { id: "wingdrake-hide", name: "Wingdrake Hide", group: "material", iconType: "white-pelt" },

    // ----- Other -----
    { id: "aqua-sac", name: "Aqua Sac", group: "other", iconType: "white-sac" },
    { id: "bird-wyvern-gem", name: "Bird Wyvern Gem", group: "other", iconType: "white-gem" },
    { id: "black-spiral-horn", name: "Black Spiral Horn", group: "other", iconType: "white-claw" },
    { id: "blos-medulla", name: "Blos Medulla", group: "other", iconType: "white-head" },
    { id: "coral-crystal", name: "Coral Crystal", group: "other", iconType: "white-gem" },
    { id: "earth-crystal", name: "Earth Crystal", group: "other", iconType: "white-gem" },
    { id: "elder-dragon-blood", name: "Elder Dragon Blood", group: "other", iconType: "white-juice" },
    { id: "elder-dragon-bone", name: "Elder Dragon Bone", group: "other", iconType: "white-bone" },
    { id: "electrode", name: "Electrode", group: "other", iconType: "white-head" },
    { id: "electro-sac", name: "Electro Sac", group: "other", iconType: "white-sac" },
    { id: "fertile-mud", name: "Fertile Mud", group: "other", iconType: "white-dump" },
    { id: "firecell-stone", name: "Firecell Stone", group: "other", iconType: "white-ore" },
    { id: "fire-dragon-scale", name: "Fire Dragon Scale", group: "other", iconType: "white-scale" },
    { id: "flame-sac", name: "Flame Sac", group: "other", iconType: "white-sac" },
    { id: "gajau-scale", name: "Gajau Scale", group: "other", iconType: "white-scale" },
    { id: "immortal-dragonscale", name: "Immortal Dragonscale", group: "other", iconType: "white-scale" },
    { id: "inferno-sac", name: "Inferno Sac", group: "other", iconType: "white-sac" },
    { id: "majestic-horn", name: "Majestic Horn", group: "other", iconType: "white-claw" },
    { id: "novacrystal", name: "Novacrystal", group: "other", iconType: "white-gem" },
    { id: "piercing-claw", name: "Piercing Claw", group: "other", iconType: "white-claw" },
    { id: "poison-sac", name: "Poison Sac", group: "other", iconType: "white-sac" },
    { id: "sharp-claw", name: "Sharp Claw", group: "other", iconType: "white-claw" },
    { id: "thunder-sac", name: "Thunder Sac", group: "other", iconType: "white-sac" },
    { id: "toxin-sac", name: "Toxin Sac", group: "other", iconType: "white-sac" },
    { id: "twisted-horn", name: "Twisted Horn", group: "other", iconType: "white-claw" },
    { id: "warm-pelt", name: "Warm Pelt", group: "other", iconType: "white-pelt" },
    { id: "wyvern-gem", name: "Wyvern Gem", group: "other", iconType: "white-gem" },

    // ----- Monster parts: Great Jagras -----
    ...monsterParts("jagras", [
      ["great-jagras-claw", "Great Jagras Claw", "Claw", "white-claw"],
      ["great-jagras-hide", "Great Jagras Hide", "Hide", "white-pelt"],
      ["great-jagras-mane", "Great Jagras Mane", "Mane", "white-head"],
      ["great-jagras-scale", "Great Jagras Scale", "Scale", "white-scale"],
    ]),

    // ----- Tobi-Kadachi -----
    ...monsterParts("tobi-kadachi", [
      ["tobi-kadachi-claw", "Tobi-Kadachi Claw", "Claw", "white-claw"],
      ["tobi-kadachi-electrode", "Tobi-Kadachi Electrode", "Electrode", "white-head"],
      ["tobi-kadachi-membrane", "Tobi-Kadachi Membrane", "Membrane", "white-head"],
      ["tobi-kadachi-pelt", "Tobi-Kadachi Pelt", "Pelt", "white-pelt"],
      ["tobi-kadachi-scale", "Tobi-Kadachi Scale", "Scale", "white-scale"],
    ]),

    // ----- Anjanath -----
    ...monsterParts("anjanath", [
      ["anjanath-fang", "Anjanath Fang", "Fang", "white-claw"],
      ["anjanath-nosebone", "Anjanath Nosebone", "Nosebone", "white-bone"],
      ["anjanath-pelt", "Anjanath Pelt", "Pelt", "white-pelt"],
      ["anjanath-scale", "Anjanath Scale", "Scale", "white-scale"],
      ["anjanath-tail", "Anjanath Tail", "Tail", "white-tail"],
    ]),

    // ----- Rathalos -----
    ...monsterParts("rathalos", [
      ["rathalos-carapace", "Rathalos Carapace", "Carapace", "white-carapace"],
      ["rathalos-marrow", "Rathalos Marrow", "Marrow", "white-head"],
      ["rathalos-medulla", "Rathalos Medulla", "Medulla", "white-head"],
      ["rathalos-plate", "Rathalos Plate", "Plate", "white-plate"],
      ["rathalos-scale", "Rathalos Scale", "Scale", "white-scale"],
      ["rathalos-shell", "Rathalos Shell", "Shell", "white-shell"],
      ["rathalos-tail", "Rathalos Tail", "Tail", "white-tail"],
      ["rathalos-webbing", "Rathalos Webbing", "Webbing", "white-honey"],
      ["rathalos-wing", "Rathalos Wing", "Wing", "white-wing"],
      ["rathalos-wingtalon", "Rathalos Wingtalon", "Wingtalon", "white-claw"],
    ]),

    // ----- Azure Rathalos -----
    ...monsterParts("azure-rathalos", [
      ["azure-rathalos-carapace", "Azure Rathalos Carapace", "Carapace", "white-carapace"],
      ["azure-rathalos-marrow", "Azure Rathalos Marrow", "Marrow", "white-head"],
      ["azure-rathalos-plate", "Azure Rathalos Plate", "Plate", "white-plate"],
      ["azure-rathalos-scale", "Azure Rathalos Scale", "Scale", "white-scale"],
      ["azure-rathalos-tail", "Azure Rathalos Tail", "Tail", "white-tail"],
      ["azure-rathalos-wing", "Azure Rathalos Wing", "Wing", "white-wing"],
      ["azure-rathalos-wingtalon", "Azure Rathalos Wingtalon", "Wingtalon", "white-claw"],
    ]),
  ],

  items: [
    { id: "potion", name: "Potion", description: "Restores health." },
    { id: "mega-potion", name: "Mega Potion", description: "Restores more health." },
    { id: "antidote", name: "Antidote", description: "Cures poison." },
    { id: "small-barrel-bomb", name: "Small Barrel Bomb", description: "Damage to an adjacent monster." },
    { id: "shock-trap", name: "Shock Trap", description: "Briefly immobilizes a monster." },
    { id: "pitfall-trap", name: "Pitfall Trap", description: "Traps a monster on the ground." },
  ],

  monsters: [
    { id: "jagras", name: "Great Jagras", kind: "Fanged Wyvern", notes: "First assigned investigation." },
    { id: "tobi-kadachi", name: "Tobi-Kadachi", kind: "Fanged Wyvern", notes: "Thunder element." },
    { id: "anjanath", name: "Anjanath", kind: "Brute Wyvern", notes: "Fire element." },
    { id: "rathalos", name: "Rathalos", kind: "Flying Wyvern", notes: "King of the Skies." },
    { id: "azure-rathalos", name: "Azure Rathalos", kind: "Flying Wyvern", notes: "Stronger Rathalos variant." },
  ],

  gear: [
    // ----- Legacy weapon stubs (Switch Axe, Charge Blade, etc.) -----
    {
      id: "proto-commission-axe",
      name: "Proto Commission Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [],
      effect: "Starter Switch Axe.",
    },
    {
      id: "kadachi-axe",
      name: "Kadachi Lion Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [
        { materialId: "tobi-kadachi-claw", qty: 2 },
        { materialId: "tobi-kadachi-pelt", qty: 3 },
        { materialId: "monster-bone-small", qty: 1 },
      ],
      effect: "Thunder element.",
    },
    {
      id: "rath-axe",
      name: "Rathalos Firaxe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [
        { materialId: "rathalos-shell", qty: 3 },
        { materialId: "rathalos-wing", qty: 1 },
        { materialId: "carbalite-ore", qty: 4 },
      ],
      effect: "Fire element. High raw damage.",
    },
    {
      id: "proto-commission-blade",
      name: "Proto Commission Blade",
      slot: "weapon",
      weaponType: "Charge Blade",
      cost: [],
      effect: "Starter Charge Blade.",
    },
    {
      id: "proto-commission-glaive",
      name: "Proto Commission Glaive",
      slot: "weapon",
      weaponType: "Insect Glaive",
      cost: [],
      effect: "Starter Insect Glaive.",
    },
    {
      id: "proto-commission-bowgun",
      name: "Proto Commission Bowgun",
      slot: "weapon",
      weaponType: "Heavy Bowgun",
      cost: [],
      effect: "Starter Heavy Bowgun.",
    },
  ],
};

function monsterParts(
  monsterId: string,
  parts: [id: string, name: string, shortName: string, iconType: string][],
): Material[] {
  return parts.map(([id, name, shortName, iconType]) => ({
    id,
    name,
    group: "monster" as const,
    iconType,
    monsterId,
    shortName,
  }));
}

/** Monsters shown in the Monster Teile picker, in display order. */
export const inventoryMonsters = ancientForest.monsters;
