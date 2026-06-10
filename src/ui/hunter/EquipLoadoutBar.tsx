import { catalog, hunterTotalDefense } from "../../domain/catalog";
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
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl active:scale-95 ${
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
          className={`grid h-full w-full place-items-center rounded-xl border border-dashed border-line bg-paper-2 text-sm text-ink-soft ${
            slot === "weapon" ? "text-xl" : "text-[11px]"
          }`}
        >
          {SLOT_BADGE[slot]}
        </span>
      )}
    </button>
  );
}

/** Top loadout strip: weapon + armour slots with a defence shield on the right. */
export function EquipLoadoutBar({
  hunter,
  tab,
  onUnequip,
}: {
  hunter: Hunter;
  tab: Tab;
  onUnequip: (slot: GearSlot) => void;
}) {
  const totalDef = hunterTotalDefense(hunter);

  return (
    <div className="paper-card flex items-center gap-2 px-3 py-3">
      <div className="flex items-center gap-2">
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
      <div className="flex flex-1 items-center justify-center">
        <div
          className="grid h-12 w-11 place-items-center"
          title="Defense"
          style={{
            background: "var(--color-accent)",
            clipPath: "polygon(6% 4%, 94% 4%, 94% 58%, 50% 100%, 6% 58%)",
          }}
        >
          <span className="font-display text-lg font-bold leading-none text-white">
            {totalDef}
          </span>
        </div>
      </div>
    </div>
  );
}
