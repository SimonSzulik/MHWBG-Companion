import type { GearDef } from "../../domain/types";
import { EquipNode } from "./EquipNode";

/** Grid of owned gear as forge-style circles inside the forge-graph panel. */
export function OwnedGearGrid({
  items,
  isEquipped,
  emptyLabel,
  onSelect,
}: {
  items: GearDef[];
  isEquipped: (gear: GearDef) => boolean;
  emptyLabel: string;
  onSelect: (gear: GearDef) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="forge-graph p-6 text-center text-sm text-ink-soft">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="forge-graph p-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((gear) => (
          <EquipNode
            key={gear.id}
            gear={gear}
            equipped={isEquipped(gear)}
            onClick={() => onSelect(gear)}
          />
        ))}
      </div>
    </div>
  );
}
