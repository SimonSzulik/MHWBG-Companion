import type { ExpansionId, WeaponType } from "../domain/types";

export interface ExpansionDef {
  id: ExpansionId;
  name: string;
  /** Short line for the picker. */
  blurb: string;
  /** Always owned and hidden from the picker. */
  implicit?: boolean;
  /** Weapon types this box unlocks (Hunter's Arsenal only). */
  weaponTypes?: WeaponType[];
  /**
   * Days this box adds to a combined campaign timer.
   * Ancient Forest rulebook p.38: adding Wildspire Waste adds 20 days.
   */
  addsDays?: number;
}

export const EXPANSIONS: ExpansionDef[] = [
  {
    id: "core",
    name: "Core rules",
    blurb: "Common ores, bones, potions and starter armour.",
    implicit: true,
  },
  {
    id: "ancient-forest",
    name: "Ancient Forest",
    blurb: "Great Jagras, Tobi-Kadachi, Anjanath, Rathalos, Azure Rathalos.",
  },
  {
    id: "wildspire-waste",
    name: "Wildspire Waste",
    blurb: "Barroth, Pukei-Pukei, Jyuratodus, Diablos, Black Diablos.",
    addsDays: 20,
  },
  {
    id: "hunters-arsenal",
    name: "Hunter's Arsenal",
    blurb: "Long Sword, Hammer, Gunlance, Light Bowgun, Lance, Hunting Horn.",
    weaponTypes: [
      "Long Sword",
      "Hammer",
      "Gunlance",
      "Light Bowgun",
      "Lance",
      "Hunting Horn",
    ],
  },
  {
    id: "kulu-ya-ku",
    name: "Kulu-Ya-Ku",
    blurb: "The tool-using Bird Wyvern. Kickstarter exclusive.",
  },
  {
    id: "kushala-daora",
    name: "Kushala Daora",
    blurb: "Elder Dragon of the steel winds. 5★ tempered hunt.",
  },
  {
    id: "nergigante",
    name: "Nergigante",
    blurb: "Elder Dragon with regrowing spikes. 5★ tempered hunt.",
  },
  {
    id: "teostra",
    name: "Teostra",
    blurb: "Elder Dragon of flame and blast. 5★ tempered hunt.",
  },
];

export const EXPANSION_BY_ID = new Map(EXPANSIONS.map((e) => [e.id, e]));

/** Boxes a player can tick; `core` is implied. */
export const SELECTABLE_EXPANSIONS = EXPANSIONS.filter((e) => !e.implicit);

/** A brand-new campaign starts with the first core box only. */
export const DEFAULT_BOXES: ExpansionId[] = ["core", "ancient-forest"];

/**
 * What the app shipped before boxes existed — every save predating this feature
 * had access to all of it, so that is what those saves migrate to. Defaulting
 * them to Ancient Forest alone would make a Barroth stash or a Hunting Horn
 * hunter vanish from the UI overnight.
 */
export const LEGACY_BOXES: ExpansionId[] = [
  "core",
  "ancient-forest",
  "wildspire-waste",
  "hunters-arsenal",
];
// Note: the monster expansions are deliberately absent — they were added after
// box selection existed, so no save has ever implicitly had them.

/** Weapon type -> the box that provides it. */
export const WEAPON_EXPANSION = new Map<WeaponType, ExpansionId>(
  EXPANSIONS.flatMap((e) =>
    (e.weaponTypes ?? []).map((w) => [w, e.id] as [WeaponType, ExpansionId]),
  ),
);

/** Normalise anything persisted into a usable, `core`-containing list. */
export function normalizeBoxes(raw: unknown): ExpansionId[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...LEGACY_BOXES];
  // Unknown ids are preserved: a newer client may know a box this build does
  // not, and dropping it here would erase that group's choice on round-trip.
  const ids = raw.filter((v): v is ExpansionId => typeof v === "string");
  if (ids.length === 0) return [...LEGACY_BOXES];
  return ids.includes("core") ? ids : ["core", ...ids];
}

/** Display string for the legacy `Campaign.box` field. */
export function primaryBoxLabel(boxes: readonly ExpansionId[]): string {
  const core = boxes.find((b) => b === "ancient-forest" || b === "wildspire-waste");
  return EXPANSION_BY_ID.get(core ?? "ancient-forest")?.name ?? "Ancient Forest";
}
