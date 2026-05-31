import type { GameData } from "../domain/types";
import { ancientForest } from "./ancientForest";
import {
  ancientForestWeaponGear,
  ancientForestWeaponPaths,
  FORGE_WEAPON_TYPES,
} from "./forge/ancientForestWeapons";

const legacyWeapons = ancientForest.gear.filter(
  (g) =>
    g.slot !== "weapon" ||
    !g.weaponType ||
    !FORGE_WEAPON_TYPES.includes(g.weaponType),
);

/**
 * The active box. Single switch point so the rest of the app never imports a
 * specific box directly — swap this (or make it user-selectable later) without
 * touching screens or the store.
 */
export const gameData: GameData = {
  ...ancientForest,
  gear: [...legacyWeapons, ...ancientForestWeaponGear],
  weaponPaths: ancientForestWeaponPaths,
};
