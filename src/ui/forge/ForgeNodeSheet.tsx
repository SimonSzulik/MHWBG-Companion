import { armorSetForPiece, type ForgeBranch, type ForgeNode } from "../../domain/catalog";
import type { Hunter } from "../../domain/types";
import { iconUrl } from "../../domain/icons";
import {
  CraftButton,
  DeckChangesBlock,
  ForgeNodeBadge,
  MaterialCostList,
} from "./ForgeDetails";
import { Button } from "../Button";
import { BottomSheet } from "../BottomSheet";

export function ForgeNodeSheet({
  node,
  branch,
  hunter,
  recraftable,
  onCraft,
  onClose,
}: {
  node: ForgeNode;
  branch?: ForgeBranch;
  hunter: Hunter;
  recraftable?: boolean;
  onCraft: (gearId: string) => void;
  onClose: () => void;
}) {
  const gear = node.gear;
  const armorSet = !branch && gear.slot !== "weapon" ? armorSetForPiece(gear.id) : undefined;

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
            <ForgeNodeBadge node={node} />
          </div>
          {branch && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
              <img src={iconUrl(branch.icon)} alt="" className="h-4 w-4" />
              {branch.label}
              {branch.locked && " · gesperrt"}
              {branch.chosen && " · gewählt"}
            </p>
          )}
          {armorSet && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
              <img src={iconUrl(armorSet.icon)} alt="" className="h-4 w-4" />
              {armorSet.label}
            </p>
          )}
        </div>
      </div>

      {gear.effect && (
        <p className="mt-2 text-sm text-ink-soft">{gear.effect}</p>
      )}

      {!node.forged && gear.cost.length > 0 && (
        <MaterialCostList gear={gear} hunter={hunter} />
      )}

      {!node.forged &&
        gear.slot === "weapon" &&
        node.state === "pending" &&
        node.enoughMats &&
        !node.prerequisiteMet && (
        <p className="mt-2 text-xs text-ink-soft">Erst die Vorstufe schmieden.</p>
      )}

      {gear.deckChanges && <DeckChangesBlock changes={gear.deckChanges} />}

      {node.state === "craftable" && (
        <CraftButton
          onClick={() => {
            onCraft(gear.id);
            onClose();
          }}
          label={
            recraftable && node.forged
              ? "Erneut schmieden"
              : node.held > 0 && recraftable
                ? "Erneut schmieden"
                : "Schmieden"
          }
        />
      )}

      {node.state === "locked" && gear.slot === "weapon" && (
        <p className="mt-3 text-xs text-ink-soft">
          Dieser Pfad ist gesperrt — eine andere Route wurde bereits gewählt.
        </p>
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
