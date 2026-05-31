import type { GameData } from "../domain/types";

/**
 * Ancient Forest — static catalog.
 *
 * Verified against the Ancient Forest rulebook (monster roster, weapons,
 * status ailments, terrain, armour skills, shared ores/bones). Monster-part
 * material names and forge recipe costs live on the physical cards (not in the
 * rulebook), so those are marked provisional and meant to be corrected from
 * the printed reference cards. Ids are stable; tweak names/costs freely.
 */
export const ancientForest: GameData = {
  box: "Ancient Forest",

  materials: [
    // ----- Common ores & bones (shared resource pool) -----
    { id: "carbalite-ore", name: "Carbalite Ore", category: "ore" },
    { id: "malachite-ore", name: "Malachite Ore", category: "ore" },
    { id: "dragonite-ore", name: "Dragonite Ore", category: "ore" },
    { id: "fucium-ore", name: "Fucium Ore", category: "ore" },
    { id: "quality-bone", name: "Quality Bone", category: "bone" },
    { id: "monster-bone-s", name: "Monster Bone Small", category: "bone" },
    { id: "ancient-bone", name: "Ancient Bone", category: "bone" },
    { id: "boulder-bone", name: "Boulder Bone", category: "bone" },
    { id: "dragonvein-crystal", name: "Dragonvein Crystal", category: "special" },
    { id: "coral-crystal", name: "Coral Crystal", category: "special" },
    { id: "firecell-stone", name: "Firecell Stone", category: "special" },

    // ----- Monster parts (PROVISIONAL — verify against reward cards) -----
    // Great Jagras
    { id: "jagras-claw", name: "Great Jagras Claw", category: "monster", source: "Great Jagras" },
    { id: "jagras-scale", name: "Great Jagras Scale", category: "monster", source: "Great Jagras" },
    { id: "jagras-hide", name: "Great Jagras Hide", category: "monster", source: "Great Jagras" },
    // Tobi-Kadachi
    { id: "kadachi-fang", name: "Tobi-Kadachi Fang", category: "monster", source: "Tobi-Kadachi" },
    { id: "kadachi-pelt", name: "Tobi-Kadachi Pelt", category: "monster", source: "Tobi-Kadachi" },
    { id: "kadachi-claw", name: "Tobi-Kadachi Claw", category: "monster", source: "Tobi-Kadachi" },
    // Anjanath
    { id: "anjanath-fang", name: "Anjanath Fang", category: "monster", source: "Anjanath" },
    { id: "anjanath-scale", name: "Anjanath Scale", category: "monster", source: "Anjanath" },
    { id: "anjanath-pelt", name: "Anjanath Pelt", category: "monster", source: "Anjanath" },
    { id: "anjanath-nosebone", name: "Anjanath Nose Bone", category: "monster", source: "Anjanath" },
    // Rathalos / Azure Rathalos
    { id: "rathalos-scale", name: "Rathalos Scale", category: "monster", source: "Rathalos" },
    { id: "rathalos-shell", name: "Rathalos Shell", category: "monster", source: "Rathalos" },
    { id: "rathalos-wing", name: "Rathalos Wing", category: "monster", source: "Rathalos" },
    { id: "rathalos-plate", name: "Rathalos Plate", category: "monster", source: "Rathalos" },
    { id: "rathalos-marrow", name: "Rathalos Marrow", category: "monster", source: "Azure Rathalos" },
    { id: "rath-ruby", name: "Rath Ruby", category: "monster", source: "Azure Rathalos" },
  ],

  items: [
    { id: "potion", name: "Potion", description: "Stellt Lebenspunkte wieder her." },
    { id: "mega-potion", name: "Mega Potion", description: "Stellt mehr Lebenspunkte wieder her." },
    { id: "antidote", name: "Antidote", description: "Heilt Gift." },
    { id: "small-barrel-bomb", name: "Small Barrel Bomb", description: "Schaden an einem angrenzenden Monster." },
    { id: "shock-trap", name: "Shock Trap", description: "Hält ein Monster kurz fest." },
    { id: "pitfall-trap", name: "Pitfall Trap", description: "Fängt ein Monster am Boden." },
  ],

  monsters: [
    { id: "great-jagras", name: "Great Jagras", kind: "Fanged Wyvern", notes: "Erste zugewiesene Untersuchung." },
    { id: "tobi-kadachi", name: "Tobi-Kadachi", kind: "Fanged Wyvern", notes: "Blitz-Element." },
    { id: "anjanath", name: "Anjanath", kind: "Brute Wyvern", notes: "Feuer-Element." },
    { id: "rathalos", name: "Rathalos", kind: "Flying Wyvern", notes: "König der Lüfte." },
    { id: "azure-rathalos", name: "Azure Rathalos", kind: "Flying Wyvern", notes: "Stärkere Rathalos-Variante." },
  ],

  gear: [
    // ----- Switch Axe tree -----
    {
      id: "proto-commission-axe",
      name: "Proto Commission Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [],
      effect: "Start-Switch-Axe.",
    },
    {
      id: "kadachi-axe",
      name: "Kadachi Lion Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [
        { materialId: "kadachi-fang", qty: 2 },
        { materialId: "kadachi-pelt", qty: 3 },
        { materialId: "monster-bone-s", qty: 1 },
      ],
      zenny: 1500,
      effect: "Blitz-Element.",
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
      zenny: 4000,
      effect: "Feuer-Element. Hoher Rohschaden.",
    },

    // ----- Charge Blade tree -----
    {
      id: "proto-commission-blade",
      name: "Proto Commission Blade",
      slot: "weapon",
      weaponType: "Charge Blade",
      cost: [],
      effect: "Start-Charge-Blade.",
    },

    // ----- Insect Glaive tree -----
    {
      id: "proto-commission-glaive",
      name: "Proto Commission Glaive",
      slot: "weapon",
      weaponType: "Insect Glaive",
      cost: [],
      effect: "Start-Insect-Glaive.",
    },

    // ----- Heavy Bowgun tree -----
    {
      id: "proto-commission-bowgun",
      name: "Proto Commission Bowgun",
      slot: "weapon",
      weaponType: "Heavy Bowgun",
      cost: [],
      effect: "Start-Heavy-Bowgun.",
    },

    // ----- Armour (provisional sets) -----
    {
      id: "jagras-helm",
      name: "Jagras Helm",
      slot: "head",
      cost: [
        { materialId: "jagras-scale", qty: 2 },
        { materialId: "quality-bone", qty: 1 },
      ],
      zenny: 600,
      defense: 20,
      effect: "Skill: Geologe +1.",
    },
    {
      id: "anjanath-mail",
      name: "Anjanath Mail",
      slot: "chest",
      cost: [
        { materialId: "anjanath-scale", qty: 3 },
        { materialId: "anjanath-pelt", qty: 2 },
      ],
      zenny: 1000,
      defense: 28,
      effect: "Skill: Attack Boost +1.",
    },
    {
      id: "rathalos-greaves",
      name: "Rathalos Greaves",
      slot: "legs",
      cost: [
        { materialId: "rathalos-shell", qty: 3 },
        { materialId: "rathalos-scale", qty: 2 },
      ],
      zenny: 1400,
      defense: 32,
      effect: "Skill: Weakness Exploit +1.",
    },
  ],
};
