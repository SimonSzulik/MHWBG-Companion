import { gameData } from "../data/gameData";
import type {
  ArmorForgeSet,
  Campaign,
  GearDef,
  GearSlot,
  Hunter,
  WeaponForgePath,
  WeaponType,
} from "./types";

const materialsById = new Map(gameData.materials.map((m) => [m.id, m]));
const itemsById = new Map(gameData.items.map((i) => [i.id, i]));
const gearById = new Map(gameData.gear.map((g) => [g.id, g]));
const monstersById = new Map(gameData.monsters.map((m) => [m.id, m]));

export const catalog = {
  material: (id: string) => materialsById.get(id),
  item: (id: string) => itemsById.get(id),
  gear: (id: string) => gearById.get(id),
  monster: (id: string) => monstersById.get(id),
  all: gameData,
};

export type CraftState = "owned" | "craftable" | "missing";

export function pathsForWeapon(weaponType: WeaponType): WeaponForgePath[] {
  return (gameData.weaponPaths ?? []).filter((p) => p.weaponType === weaponType);
}

export function armorSets(): ArmorForgeSet[] {
  return gameData.armorSets ?? [];
}

/** How many instances of a weapon the hunter currently holds (forge stock). */
export function heldCount(hunter: Hunter, gearId: string): number {
  return hunter.weaponStock?.[gearId] ?? 0;
}

/** A root weapon with a material cost can be forged again to open new paths. */
export function isRecraftableRoot(gear: GearDef): boolean {
  return (
    gear.slot === "weapon" && (gear.pathOrder ?? 0) === 0 && gear.cost.length > 0
  );
}

/** The free starter weapon (root, no cost) — given once, never re-forged. */
export function isFreeStarterRoot(gear: GearDef): boolean {
  return (
    gear.slot === "weapon" && (gear.pathOrder ?? 0) === 0 && gear.cost.length === 0
  );
}

/** How many times a recraftable root has been used vs. how many paths it has. */
export function rootForgeUsage(
  hunter: Hunter,
  rootId: string,
  weaponType: WeaponType,
): { used: number; cap: number } {
  const groupPaths = pathsForWeapon(weaponType).filter(
    (p) => p.gearIds[0] === rootId,
  );
  const cap = groupPaths.length;
  const owned = new Set(hunter.ownedGear);
  const chosenBranchCount = groupPaths.filter((p) =>
    p.gearIds.slice(1).some((id) => owned.has(id)),
  ).length;
  const used = heldCount(hunter, rootId) + chosenBranchCount;
  return { used, cap };
}

function prevGearIdInPath(gear: GearDef): string | undefined {
  const order = gear.pathOrder ?? 0;
  if (order <= 0 || !gear.pathId) return undefined;
  const path = gameData.weaponPaths?.find((p) => p.id === gear.pathId);
  return path?.gearIds[order - 1];
}

function hasMaterials(gear: GearDef, hunter: Hunter): boolean {
  return gear.cost.every(
    (c) => (hunter.materials[c.materialId] ?? 0) >= c.qty,
  );
}

/** Fraction of required materials the hunter currently holds (0–1). */
export function computeMaterialProgress(gear: GearDef, hunter: Hunter): number {
  if (gear.cost.length === 0) return 1;
  let have = 0;
  let need = 0;
  for (const c of gear.cost) {
    need += c.qty;
    have += Math.min(hunter.materials[c.materialId] ?? 0, c.qty);
  }
  return need === 0 ? 1 : have / need;
}

/**
 * Whether the prerequisites (held base weapon) for forging this gear are met.
 * Armour pieces have no prerequisite; weapons consume a held base instance.
 */
export function canCraftGear(gear: GearDef, hunter: Hunter): boolean {
  if (gear.slot !== "weapon") return true;
  const order = gear.pathOrder ?? 0;
  if (order === 0) {
    // Roots: the free starter is given (never forged); a re-craftable root can
    // always be (re)forged from raw materials.
    return isRecraftableRoot(gear);
  }
  const prevId = prevGearIdInPath(gear);
  return Boolean(prevId && heldCount(hunter, prevId) > 0);
}

export function craftState(gear: GearDef, hunter: Hunter): CraftState {
  // Re-craftable roots stay craftable even once owned (forge again per path).
  if (hunter.ownedGear.includes(gear.id) && !isRecraftableRoot(gear)) {
    return "owned";
  }
  if (!canCraftGear(gear, hunter)) return "missing";
  return hasMaterials(gear, hunter) ? "craftable" : "missing";
}

export function isEquipped(gearId: string, campaign: Campaign): boolean {
  const gear = catalog.gear(gearId);
  if (!gear) return false;
  return campaign.hunters.some((h) => {
    if (gear.slot === "weapon") return h.equipped.weapon === gearId;
    return h.equipped[gear.slot] === gearId;
  });
}

/** Sum defense from all equipped gear pieces. */
export function hunterTotalDefense(hunter: Hunter): number {
  return Object.values(hunter.equipped)
    .map((id) => (id ? catalog.gear(id) : undefined))
    .filter(Boolean)
    .reduce((sum, g) => sum + (g?.defense ?? 0), 0);
}

/* ---------- Weapon forge graph ---------- */

export type ForgeNodeState = "forged" | "craftable" | "pending" | "locked";

export interface ForgeNode {
  gear: GearDef;
  /** Ever forged (part of a chosen path). */
  forged: boolean;
  /** Currently-held instances of this exact weapon. */
  held: number;
  enoughMats: boolean;
  equipped: boolean;
  state: ForgeNodeState;
  /** 0–1 material progress toward forge cost. */
  materialProgress: number;
  /** Held base weapon (or recraftable root) satisfied. */
  prerequisiteMet: boolean;
}

export interface ForgeBranch {
  id: string;
  label: string;
  icon: string;
  /** Tiers beyond the shared root weapon. */
  nodes: ForgeNode[];
  /** At least one tier has been forged → this is a chosen path. */
  chosen: boolean;
  /** Cannot be pursued (free starter already committed elsewhere). */
  locked: boolean;
}

export interface ForgeRootGroup {
  rootId: string;
  root: ForgeNode;
  /** Root carries a material cost → can be re-forged for multiple paths. */
  recraftable: boolean;
  branches: ForgeBranch[];
}

function makeNode(
  gear: GearDef,
  hunter: Hunter,
  campaign: Campaign,
  state: ForgeNodeState,
): ForgeNode {
  return {
    gear,
    forged: hunter.ownedGear.includes(gear.id),
    held: heldCount(hunter, gear.id),
    enoughMats: hasMaterials(gear, hunter),
    equipped: isEquipped(gear.id, campaign),
    state,
    materialProgress: computeMaterialProgress(gear, hunter),
    prerequisiteMet: canCraftGear(gear, hunter),
  };
}

/**
 * Build the branching forge tree for a hunter's weapon type. Paths that share a
 * root weapon are grouped; each group is one root node with its branches.
 */
export function weaponForgeGraph(
  weaponType: WeaponType,
  hunter: Hunter,
  campaign: Campaign,
): ForgeRootGroup[] {
  const owned = new Set(hunter.ownedGear);

  // Group paths by their root weapon (gearIds[0]), preserving order.
  const groups = new Map<string, WeaponForgePath[]>();
  for (const p of pathsForWeapon(weaponType)) {
    const rootId = p.gearIds[0];
    const list = groups.get(rootId);
    if (list) list.push(p);
    else groups.set(rootId, [p]);
  }

  const result: ForgeRootGroup[] = [];
  for (const [rootId, groupPaths] of groups) {
    const rootGear = catalog.gear(rootId);
    if (!rootGear) continue;

    const recraftable = isRecraftableRoot(rootGear);
    const freeStarter = isFreeStarterRoot(rootGear);

    const { used: rootUsed, cap: rootCap } = rootForgeUsage(
      hunter,
      rootId,
      weaponType,
    );

    let rootState: ForgeNodeState;
    if (freeStarter) rootState = "forged";
    else if (recraftable) {
      if (rootUsed >= rootCap) rootState = "pending";
      else rootState = hasMaterials(rootGear, hunter) ? "craftable" : "pending";
    } else rootState = owned.has(rootId) ? "forged" : "pending";

    const root = makeNode(rootGear, hunter, campaign, rootState);
    if (freeStarter) root.forged = true;

    // Which branches are already chosen (any tier beyond the root forged).
    const chosenFlags = groupPaths.map((p) =>
      p.gearIds.slice(1).some((id) => owned.has(id)),
    );
    const anyChosen = chosenFlags.some(Boolean);

    const branches: ForgeBranch[] = groupPaths.map((p, bi) => {
      const chosen = chosenFlags[bi];
      // Free-starter siblings lock once one branch is committed (single base).
      const locked = freeStarter && anyChosen && !chosen;

      let prevId = rootId;
      const nodes = p.gearIds.slice(1).map((id) => {
        const gear = catalog.gear(id);
        const forged = owned.has(id);
        const prevHeld = heldCount(hunter, prevId) > 0;
        const mats = gear ? hasMaterials(gear, hunter) : false;
        let state: ForgeNodeState;
        if (forged) state = "forged";
        else if (locked) state = "locked";
        else if (prevHeld && mats) state = "craftable";
        else state = "pending";
        prevId = id;
        return gear
          ? makeNode(gear, hunter, campaign, state)
          : null;
      });

      return {
        id: p.id,
        label: p.label,
        icon: p.icon,
        nodes: nodes.filter((n): n is ForgeNode => n != null),
        chosen,
        locked,
      };
    });

    result.push({ rootId, root, recraftable, branches });
  }
  return result;
}

/* ---------- Armour by part ---------- */

export interface ArmorPartGroup {
  slot: GearSlot;
  label: string;
  pieces: GearDef[];
}

const ARMOR_PARTS: { slot: GearSlot; label: string }[] = [
  { slot: "head", label: "Helm" },
  { slot: "chest", label: "Mail" },
  { slot: "legs", label: "Greaves" },
];

/** Forgeable armour pieces grouped by body part (helm / mail / greaves). */
export function armorPartGroups(): ArmorPartGroup[] {
  const ids = new Set(armorSets().flatMap((s) => s.gearIds));
  const pieces = [...ids]
    .map((id) => catalog.gear(id))
    .filter((g): g is GearDef => g != null);
  return ARMOR_PARTS.map(({ slot, label }) => ({
    slot,
    label,
    pieces: pieces.filter((g) => g.slot === slot),
  }));
}

/** The set a forgeable armour piece belongs to (for its source label/icon). */
export function armorSetForPiece(gearId: string): ArmorForgeSet | undefined {
  return armorSets().find((s) => s.gearIds.includes(gearId));
}

export interface ForgeArmorSetRow {
  set: ArmorForgeSet;
  nodes: ForgeNode[];
}

/** Forge graph rows for armour sets (helm → mail → greaves, no prerequisites). */
export function armorForgeGraph(
  hunter: Hunter,
  campaign: Campaign,
): ForgeArmorSetRow[] {
  return armorSets().map((set) => {
    const nodes = set.gearIds
      .map((id) => {
        const gear = catalog.gear(id);
        if (!gear) return null;
        const forged = hunter.ownedGear.includes(id);
        const mats = hasMaterials(gear, hunter);
        let state: ForgeNodeState;
        if (forged) state = "forged";
        else if (mats) state = "craftable";
        else state = "pending";
        const node = makeNode(gear, hunter, campaign, state);
        node.prerequisiteMet = true;
        return node;
      })
      .filter((n): n is ForgeNode => n != null);
    return { set, nodes };
  });
}
