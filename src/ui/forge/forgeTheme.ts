import type { ForgeNode } from "../../domain/catalog";

/** Matches @theme tokens in index.css — keep in sync. */
export const FORGE_RING = {
  equipped: "#4a8fa3",
  forged: "#5b8a51",
  craftable: "#c47a2c",
  idle: "#d9cfba",
} as const;

export const FORGE_IDLE_TRACK = "#efe9da";
export const FORGE_NODE_FILL = "#faf7ef";
export const FORGE_IDLE_BORDER = "rgba(107,98,83,0.35)";

export type ForgeEdgeStyle = {
  stroke: string;
  width: number;
  flow: boolean;
  dash?: string;
  glow?: string;
};

/** Decorative armor row connectors — no status highlighting. */
export const FORGE_ARMOR_EDGE: ForgeEdgeStyle = {
  stroke: "rgba(107,98,83,0.22)",
  width: 2,
  flow: false,
};

export function forgeEdgeStyle(node: ForgeNode): ForgeEdgeStyle {
  if (node.forged) {
    return {
      stroke: FORGE_RING.forged,
      width: 2.5,
      flow: false,
      glow: "0 0 3px rgba(91,138,81,0.5)",
    };
  }
  if (node.state === "craftable") {
    return {
      stroke: FORGE_RING.craftable,
      width: 2.5,
      flow: true,
      glow: "0 0 4px rgba(196,122,44,0.55)",
    };
  }
  if (node.state === "locked") {
    return {
      stroke: "rgba(107,98,83,0.35)",
      width: 2,
      flow: false,
      dash: "3 6",
    };
  }
  return { stroke: "rgba(107,98,83,0.22)", width: 2, flow: false };
}
