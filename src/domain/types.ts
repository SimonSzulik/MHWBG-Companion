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

/** A craftable piece of gear (catalog entry / recipe). */
export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  /** For weapons: which weapon tree this belongs to. */
  weaponType?: WeaponType;
  /** Material cost to forge. */
  cost: Cost[];
  /** Zenny cost to forge. */
  zenny?: number;
  /** Granted skill/effect text shown on the hunter sheet. */
  effect?: string;
  /** Defence value for armour pieces. */
  defense?: number;
  /** Free-form notes (board game rules reference). */
  notes?: string;
}

/** Bundled static catalog for one box/expansion. */
export interface GameData {
  box: string;
  materials: Material[];
  items: ItemDef[];
  gear: GearDef[];
  monsters: MonsterDef[];
}

export interface MonsterDef {
  id: string;
  name: string;
  /** e.g. "Brute Wyvern" */
  kind?: string;
  notes?: string;
}

/* ---------- User data (the save) ---------- */

export interface Hunter {
  id: string;
  name: string;
  palicoName?: string;
  playerName?: string;
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
  hunters: Hunter[];
  zenny: number;
  materials: MaterialStash;
  items: ItemStash;
  /** Crafted/owned gear ids (unlocks beyond starting kit). */
  ownedGear: string[];
  /** Hunt id -> completed. */
  huntsCompleted: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
}
