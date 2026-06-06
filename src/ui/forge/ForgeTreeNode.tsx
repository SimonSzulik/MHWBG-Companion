import type { ForgeNode } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { ForgeNodeBadge } from "./ForgeDetails";

const RING_COLORS = {
  equipped: "#5fb6cc",
  forged: "#6fae62",
  craftable: "#d9a72c",
  idle: "rgba(255,255,255,0.16)",
} as const;

/** A single circular forge node: progress ring, weapon icon, name + badge. */
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
  const pct = Math.round(node.materialProgress * 100);
  const locked = node.state === "locked";
  const craftable = node.state === "craftable";
  const forged = node.forged;
  const equipped = node.equipped;

  const ringColor = equipped
    ? RING_COLORS.equipped
    : forged
      ? RING_COLORS.forged
      : craftable
        ? RING_COLORS.craftable
        : node.prerequisiteMet && node.materialProgress > 0
          ? RING_COLORS.craftable
          : RING_COLORS.idle;

  const fillDeg = forged ? 360 : node.materialProgress * 360;

  const borderColor = equipped
    ? RING_COLORS.equipped
    : forged
      ? RING_COLORS.forged
      : craftable
        ? RING_COLORS.craftable
        : "rgba(255,255,255,0.16)";

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
          background: `conic-gradient(${ringColor} ${fillDeg}deg, rgba(255,255,255,0.09) ${fillDeg}deg)`,
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
        {craftable && (
          <span className="absolute -right-1 -top-1 text-sm drop-shadow">🔨</span>
        )}
        {!node.prerequisiteMet && !forged && !craftable && (
          <span className="absolute -left-1 -top-1 text-[10px]">🔒</span>
        )}
      </div>

      <p className="mt-0.5 max-w-full truncate text-center text-[11px] font-semibold leading-tight text-[#ece4d4]">
        {gear.name}
      </p>
      <ForgeNodeBadge node={node} />
      {!forged && node.state === "pending" && node.prerequisiteMet && (
        <span className="text-[9px] tabular-nums text-[#b9af9c]">{pct}%</span>
      )}
    </button>
  );
}
