import { armorSetForPiece } from "../../domain/catalog";
import type { GearDef, Hunter } from "../../domain/types";
import { iconUrl } from "../../domain/icons";
import { CraftButton, DeckChangesBlock } from "../forge/ForgeDetails";
import { Button } from "../Button";
import { BottomSheet } from "../BottomSheet";

function EquipGearBadge({ equipped }: { equipped: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
        equipped ? "bg-accent-faint text-accent" : "bg-ok-soft text-ok"
      }`}
    >
      {equipped ? "AUSGERÜSTET" : "IM BESITZ"}
    </span>
  );
}

/** Forge-style bottom sheet for inspecting and equipping owned gear. */
export function EquipGearSheet({
  gear,
  hunter,
  onEquip,
  onUnequip,
  onClose,
}: {
  gear: GearDef;
  hunter: Hunter;
  onEquip: () => void;
  onUnequip: () => void;
  onClose: () => void;
}) {
  const equipped =
    gear.slot === "weapon"
      ? hunter.equipped.weapon === gear.id
      : hunter.equipped[gear.slot] === gear.id;
  const armorSet =
    gear.slot !== "weapon" ? armorSetForPiece(gear.id) : undefined;

  return (
    <BottomSheet onClose={onClose} className="max-h-[85vh] overflow-y-auto bg-paper">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
      <div className="flex items-start gap-3">
        {gear.tierIcon && (
          <img
            src={iconUrl(gear.tierIcon)}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl leading-tight">{gear.name}</p>
            <EquipGearBadge equipped={equipped} />
          </div>
          {armorSet && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
              <img src={iconUrl(armorSet.icon)} alt="" className="h-4 w-4" />
              {armorSet.label}
            </p>
          )}
          {gear.isStarter && (
            <p className="mt-0.5 text-xs text-ink-soft">Startausrüstung</p>
          )}
        </div>
      </div>

      {gear.slot !== "weapon" && gear.defense !== undefined && (
        <p className="mt-2 text-sm text-ink-soft">
          Verteidigung{" "}
          <span className="font-semibold text-ink">
            {gear.defense > 0 ? `+${gear.defense}` : gear.defense}
          </span>
        </p>
      )}

      {gear.effect && (
        <p className="mt-2 text-sm text-ink-soft">{gear.effect}</p>
      )}

      {gear.deckChanges && <DeckChangesBlock changes={gear.deckChanges} />}

      {!equipped && (
        <CraftButton
          onClick={() => {
            onEquip();
            onClose();
          }}
          label="Ausrüsten"
        />
      )}

      {equipped && (
        <Button
          variant="secondary"
          rounded="lg"
          onClick={() => {
            onUnequip();
            onClose();
          }}
          className="mt-3 w-full py-2 text-sm font-semibold"
        >
          Ablegen
        </Button>
      )}

      <Button
        variant="secondary"
        rounded="lg"
        onClick={onClose}
        className="mt-3 w-full py-2 text-sm font-semibold"
      >
        Schließen
      </Button>
    </BottomSheet>
  );
}
