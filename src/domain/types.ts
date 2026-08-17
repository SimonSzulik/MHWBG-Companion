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
  | "Gunlance"
  | "Light Bowgun"
  | "Lance"
  | "Hunting Horn"
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

/**
 * A physical product in the *Monster Hunter World* board game line.
 *
 * Only boxes whose content the app actually ships are listed. `"core"` is the
 * sentinel for content common to every core box (ores, bones, potions, starter
 * armour) — always owned, never shown in the picker.
 */
export type ExpansionId =
  | "core"
  | "ancient-forest"
  | "wildspire-waste"
  | "hunters-arsenal"
  // Single-monster expansions.
  | "kulu-ya-ku"
  | "kushala-daora"
  | "nergigante"
  | "teostra";

export interface MonsterDef {
  id: string;
  name: string;
  /** e.g. "Brute Wyvern" */
  kind?: string;
  notes?: string;
  /** Which box this monster comes in. */
  expansion?: ExpansionId;
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

export type ElementType = "fire" | "water" | "thunder" | "ice" | "dragon";

export type DowntimeActivityId =
  | "provisions"
  | "resource-center"
  | "chef"
  | "poogie"
  | "handler";

export interface ProvisionsTrade {
  /** materialId -> qty to remove (sum must be 3). */
  offered: Record<string, number>;
  /** Common material id, or "potion". */
  rewardId: string;
}

export interface TradeRequest {
  id: string;
  fromHunterId: string;
  toHunterId: string;
  /** materialId -> qty you give the partner. */
  offered: Record<string, number>;
  /** materialId -> qty you receive from the partner. */
  requested: Record<string, number>;
  status: "pending" | "accepted" | "declined";
}

export interface ActiveDowntime {
  picks: Record<string, DowntimeActivityId[]>;
  provisions: Record<string, ProvisionsTrade>;
  resourceRoll: Record<string, number>;
  chefElement: Record<string, ElementType>;
  /** Per-hunter proposed handler quest id. */
  handlerProposals: Record<string, string>;
  /** Set when all proposals match. */
  handlerQuestId: string | null;
  /** Hunter tapped “Done” after petting Poogie. */
  poogieDone: Record<string, boolean>;
  confirmedHunterIds: string[];
}

export interface Hunter {
  id: string;
  name: string;
  playerName?: string;
  /** Auth user id when synced from cloud. */
  userId?: string;
  weaponType: WeaponType;
  /** Equipped gear ids, by slot. */
  equipped: Partial<Record<GearSlot, string>>;
  /** Personal material stash. */
  materials: MaterialStash;
  /** Crafted/owned gear ids for this hunter (forge history — never shrinks). */
  ownedGear: string[];
  /**
   * Currently *held* weapon instances by gear id (forge consumption model).
   * Forging an upgrade consumes one instance of its prerequisite. Re-craftable
   * roots (cost > 0) can be forged again to open another branch; the free
   * starter (cost 0) only ever yields one instance, locking sibling branches.
   * Persisted locally; not part of the cloud row (derived from `equipped` on
   * cloud load), so it never needs a schema migration.
   */
  weaponStock?: Record<string, number>;
  /** Meowscular Chef buff — cleared after quest ends. */
  elementResistance?: ElementType;
  notes?: string;
}

/** materialId -> quantity. */
export type MaterialStash = Record<string, number>;
/** itemId -> quantity. */
export type ItemStash = Record<string, number>;

export type QuestStars =
  | "one-star"
  | "two-star"
  | "three-star"
  | "four-star"
  /** Elder dragons (Kushala Daora, Nergigante, Teostra) top out at 5★. */
  | "five-star";

/** Snapshot of quest loot stored on the calendar day entry. */
export interface QuestDayReport {
  questId: string;
  investigationLoot: InvestigationLootByHunter;
  rolledLoot: Record<string, Record<string, number>>;
  keepInvestigationLoot?: boolean;
}

export type CalendarDayEntry =
  | { kind: "downtime" }
  | {
      kind: "quest";
      monsterId: string;
      stars: QuestStars;
      result: "success" | "failure";
      handler?: boolean;
      report?: QuestDayReport;
    };

/** Legacy quest-only day log entries (pre-downtime saves). */
export function normalizeCalendarDayEntry(
  raw:
    | CalendarDayEntry
    | { monsterId: string; stars: QuestStars; result: "success" | "failure" },
): CalendarDayEntry {
  if ("kind" in raw) return raw;
  return {
    kind: "quest",
    monsterId: raw.monsterId,
    stars: raw.stars,
    result: raw.result,
  };
}

export interface Campaign {
  id: string;
  name: string;
  /**
   * @deprecated Display-only. Derived from `boxes`; read `boxes` for anything
   * behavioural. Kept because the Supabase column is `not null` and older
   * clients still read it.
   */
  box: string;
  /**
   * The physical boxes this group owns. Filters what the quest board, forge and
   * inventory *offer* — never what a hunter already owns. Always contains
   * `"core"`.
   */
  boxes: ExpansionId[];
  /** In-game day counter, e.g. 8 of 60. */
  day: number;
  maxDay: number;
  /** Hunter id of the campaign creator / party leader. */
  leaderId: string;
  hunters: Hunter[];
  zenny: number;
  items: ItemStash;
  /** Quest id -> completion count (0–4). */
  questCompletions: Record<string, number>;
  /** In-progress quest state (synced, shared). */
  activeQuest: ActiveQuest | null;
  /** Quest / downtime marker per calendar day (day number -> entry). */
  dayLog: Record<number, CalendarDayEntry>;
  /** Mandatory quest from Handler downtime (must play next). */
  pendingHandlerQuestId?: string | null;
  /** In-progress downtime day (synced). */
  activeDowntime?: ActiveDowntime | null;
  /** Pending material trade requests between hunters. */
  pendingTrades?: TradeRequest[];
  /** Share code for co-op (from cloud). */
  joinCode?: string;
  createdAt: number;
  updatedAt: number;
}

export type MonsterPartId =
  | "head"
  | "tail"
  | "claws"
  | "body"
  | "back"
  | "wings";

export type InvestigationLootByHunter = Record<string, Record<string, number>>;

export interface HunterLootProgress {
  dice: [number, number];
  choice?: "die1" | "die2" | "sum";
  brokenParts: MonsterPartId[];
  /** Manually confirmed loot; seeded from dice preview when rules change. */
  lootQuantities: Record<string, number>;
  confirmed: boolean;
}

export interface QuestOutcome {
  result: "success" | "failure";
  /** 1★ failure only: keep investigation loot at the cost of a campaign day. */
  keepInvestigationLoot?: boolean;
}

export interface ActiveQuest {
  questId: string;
  phase: "lobby" | "investigation" | "active" | "looting" | "summary";
  readyHunterIds: string[];
  startedByHunterId: string;
  lootProgress: Record<string, HunterLootProgress>;
  /** Items gathered before the monster fight; one bucket per hunter. */
  investigationLoot: InvestigationLootByHunter;
  /** Set when entering summary — drives reward apply + calendar. */
  outcome?: QuestOutcome;
  /** Investigation potions already added to party stockpile during looting. */
  partyPotionsApplied?: boolean;
  /** Started via Handler downtime replay. */
  handler?: boolean;
}
