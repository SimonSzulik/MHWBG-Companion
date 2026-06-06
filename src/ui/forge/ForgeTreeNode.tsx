import type { ForgeNode } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import {
  FORGE_IDLE_BORDER,
  FORGE_IDLE_TRACK,
  FORGE_NODE_FILL,
  FORGE_RING,
} from "./forgeTheme";

/**
 * A single circular forge node: progress ring + weapon icon, with the source
 * material/monster icon top-left and the craftable/locked marker top-right.
 *
 * Only weapons the hunter currently *holds* are coloured as owned (green / blue
 * if equipped). A forged-but-no-longer-held tier (a predecessor that was
 * upgraded away) is shown faded — the green path into it still marks the route
 * as completed, but the node itself reads as "not in possession".
 */
export function ForgeTreeNode({
  node,
  size,
  onClick,
}: {
  node: ForgeNode;
  size: number;
  onClick: () => void;
}) {
  const gear = node.gear;
  const icon = gear.tierIcon ?? gear.pathIcon ?? "";
  const locked = node.state === "locked";
  const craftable = node.state === "craftable";
  const forged = node.forged;
  const equipped = node.equipped;
  const held = node.held > 0;
  // Forged, no longer held, and not re-craftable right now → upgraded away.
  const consumed =
    gear.slot === "weapon" && forged && !held && !craftable;
  const owned =
    equipped || held || (forged && gear.slot !== "weapon");
  const showLock = !node.prerequisiteMet && !forged && !craftable;

  const ringColor = equipped
    ? FORGE_RING.equipped
    : held || (forged && gear.slot !== "weapon")
      ? FORGE_RING.forged
      : craftable
        ? FORGE_RING.craftable
        : consumed
          ? FORGE_RING.forged
          : node.prerequisiteMet && node.materialProgress > 0
            ? FORGE_RING.craftable
            : FORGE_RING.idle;

  const fillDeg =
    owned || craftable || consumed ? 360 : node.materialProgress * 360;

  const borderColor = equipped
    ? FORGE_RING.equipped
    : held || (forged && gear.slot !== "weapon")
      ? FORGE_RING.forged
      : craftable
        ? FORGE_RING.craftable
        : consumed
          ? FORGE_RING.forged
          : FORGE_IDLE_BORDER;

  const sourceIcon = gear.pathIcon;
  const badgeSize = Math.round(size * 0.34);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-1 active:scale-95 ${
        locked ? "opacity-45" : ""
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-full p-[3px] ${
          craftable ? "forge-node-craftable" : ""
        }`}
        style={{
          width: size,
          height: size,
          opacity: consumed ? 0.5 : 1,
          background: `conic-gradient(${ringColor} ${fillDeg}deg, ${FORGE_IDLE_TRACK} ${fillDeg}deg)`,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center rounded-full border-2"
          style={{
            background: FORGE_NODE_FILL,
            borderColor,
          }}
        >
          {icon ? (
            <img
              src={iconUrl(icon)}
              alt=""
              className="object-contain"
              style={{ width: size * 0.5, height: size * 0.5 }}
            />
          ) : (
            <span className="text-xs font-bold text-ink-soft">?</span>
          )}
        </div>

        {/* Source material/monster the weapon is forged from — top-left. */}
        {sourceIcon && (
          <span
            className="absolute -left-1 -top-1 flex items-center justify-center rounded-full border border-line bg-paper-2 shadow-sm"
            style={{ width: badgeSize, height: badgeSize }}
          >
            <img
              src={iconUrl(sourceIcon)}
              alt=""
              className="object-contain"
              style={{ width: badgeSize * 0.72, height: badgeSize * 0.72 }}
            />
          </span>
        )}

        {/* Status marker — top-right: hammer when craftable, lock when blocked. */}
        {craftable && (
          <span className="absolute -right-1 -top-1 text-sm drop-shadow">🔨</span>
        )}
        {showLock && (
          <span className="absolute -right-1 -top-1 text-[10px]">🔒</span>
        )}
      </div>

      <p className="mt-0.5 max-w-full truncate text-center text-[11px] font-semibold leading-tight text-ink">
        {gear.name}
      </p>
    </button>
  );
}
