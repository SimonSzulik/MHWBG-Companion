import type { ForgeNode } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";

const RING_COLORS = {
  equipped: "#5fb6cc",
  forged: "#6fae62",
  craftable: "#d9a72c",
  idle: "rgba(255,255,255,0.16)",
} as const;

const IDLE_TRACK = "rgba(255,255,255,0.09)";

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
    ? RING_COLORS.equipped
    : held || (forged && gear.slot !== "weapon")
      ? RING_COLORS.forged
      : craftable
        ? RING_COLORS.craftable
        : consumed
          ? RING_COLORS.forged
          : node.prerequisiteMet && node.materialProgress > 0
            ? RING_COLORS.craftable
            : RING_COLORS.idle;

  const fillDeg =
    owned || craftable || consumed ? 360 : node.materialProgress * 360;

  const borderColor = equipped
    ? RING_COLORS.equipped
    : held || (forged && gear.slot !== "weapon")
      ? RING_COLORS.forged
      : craftable
        ? RING_COLORS.craftable
        : consumed
          ? RING_COLORS.forged
          : "rgba(255,255,255,0.16)";

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
          background: `conic-gradient(${ringColor} ${fillDeg}deg, ${IDLE_TRACK} ${fillDeg}deg)`,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center rounded-full border-2"
          style={{
            background: "#241f18",
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
            <span className="text-xs font-bold text-[#b9af9c]">?</span>
          )}
        </div>

        {/* Source material/monster the weapon is forged from — top-left. */}
        {sourceIcon && (
          <span
            className="absolute -left-1 -top-1 flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.45)] bg-[#2c2620] shadow"
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

      <p className="mt-0.5 max-w-full truncate text-center text-[11px] font-semibold leading-tight text-[#ece4d4]">
        {gear.name}
      </p>
    </button>
  );
}
