import type { GameData } from "../domain/types";
import { ancientForest } from "./ancientForest";

/**
 * The active box. Single switch point so the rest of the app never imports a
 * specific box directly — swap this (or make it user-selectable later, e.g.
 * Wildspire Waste) without touching screens or the store.
 */
export const gameData: GameData = ancientForest;
