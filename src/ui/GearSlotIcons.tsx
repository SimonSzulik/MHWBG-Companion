import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearSlot, Hunter } from "../domain/types";

/** Single-letter / emoji badge shown when a slot has no tier icon. */
export const SLOT_BADGE: Record<GearSlot, string> = {
  weapon: "⚔",
  head: "H",
  chest: "M",
  arms: "A",
  waist: "W",
  legs: "G",
};

/**
 * Row of small equipped-gear icons (tier icon when forged, slot badge when
 * empty). Pass the slots to render — armour only, or weapon + armour.
 */
export function GearSlotIcons({
  hunter,
  slots,
}: {
  hunter: Hunter;
  slots: GearSlot[];
}) {
  return (
    <div className="mt-2 flex gap-1.5">
      {slots.map((slot) => {
        const gearId = hunter.equipped[slot];
        const gear = gearId ? catalog.gear(gearId) : undefined;
        if (gear?.tierIcon) {
          return (
            <img
              key={slot}
              src={iconUrl(gear.tierIcon)}
              alt=""
              className="h-7 w-7 object-contain"
            />
          );
        }
        return (
          <span
            key={slot}
            className="grid h-7 w-7 place-items-center rounded-md border border-dashed border-line bg-paper-2 text-[9px] text-ink-soft"
          >
            {SLOT_BADGE[slot]}
          </span>
        );
      })}
    </div>
  );
}
