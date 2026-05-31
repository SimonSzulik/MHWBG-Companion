/**
 * Domain model for the MHW board game companion.
 *
 * Two layers:
 *  - Static game data (catalog): weapons, armour, materials, recipes —
 *    bundled read-only seed data (see src/data). Wildspire Waste for now.
 *  - User data (campaign): the player's mutable save — hunters, inventory,
 *    owned/crafted gear, progress. Persisted locally (local-first); cloud
 *    sync (Supabase) layers on top later without changing these shapes.
 */

/** Weapon archetypes a hunter can main. Locks the relevant forge tree. */
export type WeaponType =
  | "Switch Axe"
  | "Charge Blade"
  | "Insect Glaive"
  | "Heavy Bowgun"
  | "Sword & Shield"
  | "Great Sword"
  | "Dual Blades"
  | "Hammer"
  | "Long Sword"
  | "Bow";

/** Which inventory tab a material belongs to. */
export type InventoryGroup = "material" | "other" | "monster";

/** A type of craftable/collectable material (catalog entry). */
export interface Material {
  id: string;
  name: string;
  group: InventoryGroup;
  /** Icon filename stem, e.g. "white-ore". Maps to /icons/{iconType}.png */
  iconType: string;
  /** Monster icon stem for group === "monster", e.g. "jagras". */
  monsterId?: string;
  /** Short label in monster-part submenus, e.g. "Claw". */
  shortName?: string;
}

/** A consumable item (potions, bombs, traps…). */
export interface ItemDef {
  id: string;
  name: string;
  description?: string;
}

/** A material cost entry: how many of a given material. */
export interface Cost {
  materialId: string;
  qty: number;
}

export type GearSlot = "weapon" | "head" | "chest" | "arms" | "waist" | "legs";

/** Deck modifications when forging a weapon (reference card Remove/Add). */
export interface DeckChanges {
  remove?: string[];
  add?: string[];
}

/** A craftable piece of gear (catalog entry / recipe). */
export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  /** For weapons: which weapon tree this belongs to. */
  weaponType?: WeaponType;
  /** Material cost to forge. */
  cost: Cost[];
  /** Granted skill/effect text shown on the hunter sheet. */
  effect?: string;
  /** Forge path this weapon belongs to (weapons only). */
  pathId?: string;
  /** Position in path: 0 = entry, 1 = tier 2, 2 = tier 3. */
  pathOrder?: number;
  /** reDBo0n tier icon stem, e.g. "yellow-great-sword". */
  tierIcon?: string;
  /** Path header icon stem, e.g. "white-ore". */
  pathIcon?: string;
  /** Campaign-start default for this weapon type. */
  isStarter?: boolean;
  /** Deck change notes from reference card. */
  deckChanges?: DeckChanges;
  /** Defence value for armour pieces. */
  defense?: number;
  /** Free-form notes (board game rules reference). */
  notes?: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  /** e.g. "Brute Wyvern" */
  kind?: string;
  notes?: string;
}

/** A weapon forge upgrade path (Ancient Forest reference cards). */
export interface WeaponForgePath {
  id: string;
  weaponType: WeaponType;
  label: string;
  icon: string;
  gearIds: string[];
}

/** An armour forge set (Ancient Forest reference card row). */
export interface ArmorForgeSet {
  id: string;
  label: string;
  icon: string;
  gearIds: string[];
}

/** Bundled static catalog for one box/expansion. */
export interface GameData {
  box: string;
  materials: Material[];
  items: ItemDef[];
  gear: GearDef[];
  monsters: MonsterDef[];
  weaponPaths?: WeaponForgePath[];
  armorSets?: ArmorForgeSet[];
}

/* ---------- User data (the save) ---------- */

export interface Hunter {
  id: string;
  name: string;
  palicoName?: string;
  playerName?: string;
  /** Auth user id when synced from cloud. */
  userId?: string;
  weaponType: WeaponType;
  /** Equipped gear ids, by slot. */
  equipped: Partial<Record<GearSlot, string>>;
  notes?: string;
}

/** materialId -> quantity (shared party stash). */
export type MaterialStash = Record<string, number>;
/** itemId -> quantity. */
export type ItemStash = Record<string, number>;

export interface Campaign {
  id: string;
  name: string;
  box: string;
  /** In-game day counter, e.g. 8 of 60. */
  day: number;
  maxDay: number;
  /** Hunter id of the campaign creator / party leader. */
  leaderId: string;
  hunters: Hunter[];
  zenny: number;
  materials: MaterialStash;
  items: ItemStash;
  /** Crafted/owned gear ids (unlocks beyond starting kit). */
  ownedGear: string[];
  /** Quest id -> completion count (0–4). */
  questCompletions: Record<string, number>;
  /** Share code for co-op (from cloud). */
  joinCode?: string;
  createdAt: number;
  updatedAt: number;
}
