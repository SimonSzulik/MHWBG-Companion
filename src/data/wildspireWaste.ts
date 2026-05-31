import type { GameData } from "../domain/types";

/**
 * Wildspire Waste — static catalog (SEED / PROVISIONAL).
 *
 * NOTE: The official rulebook PDFs are scanned images without a text layer,
 * so these values are a hand-seeded starting set using canonical MHW names.
 * They are meant to be verified/corrected against the printed reference
 * cards. Treat ids as stable; tweak names/costs freely. This is the single
 * source of truth for the catalog — the UI renders whatever lives here.
 */
export const wildspireWaste: GameData = {
  box: "Wildspire Waste",

  materials: [
    // ores & bones
    { id: "carbalite-ore", name: "Carbalite Ore", category: "ore" },
    { id: "dragonite-ore", name: "Dragonite Ore", category: "ore" },
    { id: "quality-bone", name: "Quality Bone", category: "bone" },
    { id: "monster-bone-s", name: "Monster Bone S", category: "bone" },
    { id: "monster-bone-m", name: "Monster Bone M", category: "bone" },
    // monster parts — Barroth
    { id: "barroth-claw", name: "Barroth Claw", category: "monster", source: "Barroth" },
    { id: "barroth-shell", name: "Barroth Shell", category: "monster", source: "Barroth" },
    { id: "barroth-carapace", name: "Barroth Carapace", category: "monster", source: "Barroth" },
    { id: "barroth-ridge", name: "Barroth Ridge", category: "monster", source: "Barroth" },
    // monster parts — Diablos
    { id: "diablos-ridge", name: "Diablos Ridge", category: "monster", source: "Diablos" },
    { id: "diablos-shell", name: "Diablos Shell", category: "monster", source: "Diablos" },
    { id: "diablos-fang", name: "Diablos Fang", category: "monster", source: "Diablos" },
    // monster parts — Pukei-Pukei
    { id: "pukei-quill", name: "Pukei Quill", category: "monster", source: "Pukei-Pukei" },
    { id: "pukei-sac", name: "Poison Sac", category: "monster", source: "Pukei-Pukei" },
    // special
    { id: "fertile-mud", name: "Fertile Mud", category: "special" },
  ],

  items: [
    { id: "potion", name: "Potion", description: "Restore a small amount of health." },
    { id: "mega-potion", name: "Mega Potion", description: "Restore a large amount of health." },
    { id: "antidote", name: "Antidote", description: "Cures poison." },
    { id: "small-barrel-bomb", name: "Small Barrel Bomb", description: "Deals damage to an adjacent monster." },
    { id: "shock-trap", name: "Shock Trap", description: "Immobilises a monster for a short time." },
    { id: "pitfall-trap", name: "Pitfall Trap", description: "Traps a grounded monster." },
  ],

  monsters: [
    { id: "barroth", name: "Barroth", kind: "Brute Wyvern" },
    { id: "diablos", name: "Diablos", kind: "Flying Wyvern" },
    { id: "pukei-pukei", name: "Pukei-Pukei", kind: "Bird Wyvern" },
    { id: "great-jagras", name: "Great Jagras", kind: "Fanged Wyvern" },
  ],

  gear: [
    // ----- Switch Axe tree -----
    {
      id: "proto-commission-axe",
      name: "Proto Commission Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [],
      effect: "Starting Switch Axe.",
    },
    {
      id: "mudslide-axe",
      name: "Mudslide Blade",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [
        { materialId: "barroth-claw", qty: 2 },
        { materialId: "barroth-shell", qty: 4 },
        { materialId: "monster-bone-m", qty: 1 },
      ],
      zenny: 1500,
      effect: "Water element. Strong vs. Barroth.",
    },
    {
      id: "elite-commission-axe",
      name: "Elite Commission Axe",
      slot: "weapon",
      weaponType: "Switch Axe",
      cost: [
        { materialId: "barroth-carapace", qty: 3 },
        { materialId: "fertile-mud", qty: 2 },
        { materialId: "carbalite-ore", qty: 4 },
      ],
      zenny: 4000,
      effect: "Upgraded raw damage.",
    },

    // ----- Charge Blade tree -----
    {
      id: "proto-commission-blade",
      name: "Proto Commission Blade",
      slot: "weapon",
      weaponType: "Charge Blade",
      cost: [],
      effect: "Starting Charge Blade.",
    },

    // ----- Armour (shared examples) -----
    {
      id: "barroth-helm",
      name: "Barroth Helm",
      slot: "head",
      cost: [
        { materialId: "barroth-shell", qty: 2 },
        { materialId: "quality-bone", qty: 1 },
      ],
      zenny: 800,
      defense: 24,
      effect: "Skill: Tremor Resistance +1.",
    },
    {
      id: "barroth-mail",
      name: "Barroth Mail",
      slot: "chest",
      cost: [
        { materialId: "barroth-shell", qty: 3 },
        { materialId: "barroth-ridge", qty: 1 },
      ],
      zenny: 800,
      defense: 26,
      effect: "Skill: Attack Boost +1.",
    },
    {
      id: "diablos-greaves",
      name: "Diablos Greaves",
      slot: "legs",
      cost: [
        { materialId: "diablos-shell", qty: 3 },
        { materialId: "diablos-fang", qty: 1 },
      ],
      zenny: 1200,
      defense: 30,
      effect: "Skill: Bludgeoner +1.",
    },
  ],
};
