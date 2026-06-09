import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { LOADOUT_SLOTS } from "../../domain/loadout";
import { SLOT_BADGE } from "../GearSlotIcons";
import { FORGE_RING } from "../forge/forgeTheme";
import type { GearSlot, Hunter } from "../../domain/types";

type Tab = "weapons" | "armour";

function slotHighlighted(slot: GearSlot, tab: Tab): boolean {
  if (tab === "weapons") return slot === "weapon";
  return slot !== "weapon";
}

function EquipSlotButton({
  slot,
  gearId,
  highlight,
  onTap,
}: {
  slot: GearSlot;
  gearId?: string;
  highlight: boolean;
  onTap: () => void;
}) {
  const gear = gearId ? catalog.gear(gearId) : undefined;
  const equipped = Boolean(gearId);

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={gear?.name ?? SLOT_BADGE[slot]}
      className={`flex flex-1 aspect-square h-14 max-w-16 items-center justify-center rounded-xl active:scale-95 ${
        highlight ? "ring-2 ring-accent/60" : ""
      }`}
      style={equipped ? { boxShadow: `0 0 0 2px ${FORGE_RING.equipped}` } : undefined}
    >
      {gear?.tierIcon ? (
        <img
          src={iconUrl(gear.tierIcon)}
          alt=""
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center rounded-xl border border-dashed border-line text-sm text-ink-soft ${
            slot === "weapon" ? "text-xl" : "text-[11px]"
          }`}
        >
          {SLOT_BADGE[slot]}
        </span>
      )}
    </button>
  );
}

/** Top loadout strip: weapon + armour in one equal-sized row; tap equipped slot to unequip. */
export function EquipLoadoutBar({
  hunter,
  tab,
  onUnequip,
}: {
  hunter: Hunter;
  tab: Tab;
  onUnequip: (slot: GearSlot) => void;
}) {
  return (
    <div className="paper-card flex items-center justify-center gap-2 px-3 py-3">
      {LOADOUT_SLOTS.map((slot) => (
        <EquipSlotButton
          key={slot}
          slot={slot}
          gearId={hunter.equipped[slot]}
          highlight={slotHighlighted(slot, tab)}
          onTap={() => {
            const gearId = hunter.equipped[slot];
            if (gearId) onUnequip(slot);
          }}
        />
      ))}
    </div>
  );
}
