import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { LOADOUT_ARMOR_SLOTS } from "../../domain/loadout";
import { SLOT_BADGE } from "../GearSlotIcons";
import { FORGE_RING } from "../forge/forgeTheme";
import type { GearSlot, Hunter } from "../../domain/types";

type Tab = "weapons" | "armour";

function EquipSlotButton({
  slot,
  gearId,
  size,
  highlight,
  onTap,
}: {
  slot: GearSlot;
  gearId?: string;
  size: "lg" | "sm";
  highlight: boolean;
  onTap: () => void;
}) {
  const gear = gearId ? catalog.gear(gearId) : undefined;
  const dim = size === "lg" ? "h-14 w-14" : "h-7 w-7";
  const equipped = Boolean(gearId);

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={gear?.name ?? SLOT_BADGE[slot]}
      className={`shrink-0 rounded-xl active:scale-95 ${
        highlight ? "ring-2 ring-accent/60" : ""
      }`}
      style={equipped ? { boxShadow: `0 0 0 2px ${FORGE_RING.equipped}` } : undefined}
    >
      {gear?.tierIcon ? (
        <img
          src={iconUrl(gear.tierIcon)}
          alt=""
          className={`${dim} object-contain`}
        />
      ) : (
        <span
          className={`grid ${dim} place-items-center rounded-xl border border-dashed border-line bg-paper-2 ${
            size === "lg" ? "text-2xl" : "text-[9px] text-ink-soft"
          }`}
        >
          {SLOT_BADGE[slot]}
        </span>
      )}
    </button>
  );
}

/** Top loadout strip: weapon + armour slots; tap equipped slot to unequip. */
export function EquipLoadoutBar({
  hunter,
  tab,
  onUnequip,
}: {
  hunter: Hunter;
  tab: Tab;
  onUnequip: (slot: GearSlot) => void;
}) {
  const handleSlot = (slot: GearSlot, gearId?: string) => {
    if (gearId) onUnequip(slot);
  };

  return (
    <div className="paper-card flex items-center gap-3 px-3 py-3">
      <EquipSlotButton
        slot="weapon"
        gearId={hunter.equipped.weapon}
        size="lg"
        highlight={tab === "weapons"}
        onTap={() => handleSlot("weapon", hunter.equipped.weapon)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-ink-soft">Ausrüstung</p>
        <div className="flex gap-1.5">
          {LOADOUT_ARMOR_SLOTS.map((slot) => (
            <EquipSlotButton
              key={slot}
              slot={slot}
              gearId={hunter.equipped[slot]}
              size="sm"
              highlight={tab === "armour"}
              onTap={() => handleSlot(slot, hunter.equipped[slot])}
            />
          ))}
        </div>
        {!hunter.equipped.weapon &&
          tab === "weapons" && (
            <p className="text-[10px] text-ink-soft">Waffe unten antippen</p>
          )}
        {tab === "armour" &&
          LOADOUT_ARMOR_SLOTS.every((s) => !hunter.equipped[s]) && (
            <p className="text-[10px] text-ink-soft">Rüstung unten antippen</p>
          )}
      </div>
    </div>
  );
}
