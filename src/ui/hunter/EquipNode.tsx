import type { GearDef } from "../../domain/types";
import { iconUrl } from "../../domain/icons";
import {
  FORGE_IDLE_TRACK,
  FORGE_NODE_FILL,
  FORGE_RING,
} from "../forge/forgeTheme";

const NODE = 48;

/**
 * Forge-style circle for the loadout grid — owned (green) or equipped (blue).
 */
export function EquipNode({
  gear,
  equipped,
  onClick,
}: {
  gear: GearDef;
  equipped: boolean;
  onClick: () => void;
}) {
  const icon = gear.tierIcon ?? gear.pathIcon ?? "";
  const ringColor = equipped ? FORGE_RING.equipped : FORGE_RING.forged;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-1 active:scale-95"
    >
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full p-[3px]"
        style={{
          width: NODE,
          height: NODE,
          background: `conic-gradient(${ringColor} 360deg, ${FORGE_IDLE_TRACK} 360deg)`,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center rounded-full border-2"
          style={{
            background: FORGE_NODE_FILL,
            borderColor: ringColor,
          }}
        >
          {icon ? (
            <img
              src={iconUrl(icon)}
              alt=""
              className="object-contain"
              style={{ width: NODE * 0.5, height: NODE * 0.5 }}
            />
          ) : (
            <span className="text-xs font-bold text-ink-soft">?</span>
          )}
        </div>
      </div>
      <p className="max-w-full truncate text-center text-[11px] font-semibold leading-tight text-ink">
        {gear.name}
      </p>
    </button>
  );
}
