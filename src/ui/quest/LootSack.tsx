import { useState } from "react";
import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import type { Material } from "../../domain/types";
import { BottomSheet } from "../BottomSheet";
import { Button } from "../Button";

/** Loot bag grid for quest looting — tap to adjust quantities. */
export function LootSack({
  quantities,
  onSetQty,
}: {
  quantities: Record<string, number>;
  onSetQty: (materialId: string, qty: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const materialIds = Object.keys(quantities)
    .filter((id) => (quantities[id] ?? 0) > 0)
    .sort();

  if (materialIds.length === 0) return null;

  const selected = selectedId ? catalog.material(selectedId) : null;

  return (
    <div className="paper-card p-4">
      <p className="mb-3 font-display text-lg">Loot</p>
      <div className="grid grid-cols-4 gap-2">
        {materialIds.map((id) => {
          const material = catalog.material(id);
          const qty = quantities[id] ?? 0;
          if (!material) return null;
          return (
            <LootSackTile
              key={id}
              material={material}
              qty={qty}
              selected={selectedId === id}
              onClick={() => setSelectedId(id)}
            />
          );
        })}
      </div>

      {selected && selectedId && (
        <LootSackItemSheet
          material={selected}
          qty={quantities[selectedId] ?? 0}
          onSet={(next) => onSetQty(selectedId, next)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function LootSackTile({
  material,
  qty,
  selected,
  onClick,
}: {
  material: Material;
  qty: number;
  selected: boolean;
  onClick: () => void;
}) {
  const label = material.shortName ?? material.name;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-xl border-[1.5px] px-1 pb-1.5 pt-2 active:scale-[0.97] ${
        selected
          ? "border-accent bg-accent-faint ring-1 ring-accent"
          : "border-line-strong bg-card"
      }`}
    >
      {material.group === "monster" && material.monsterId && (
        <img
          src={iconUrl(material.monsterId)}
          alt=""
          className="absolute left-0.5 top-0.5 h-4 w-4 object-contain"
        />
      )}
      <span className="absolute right-1 top-1 rounded-full bg-accent px-1.5 py-px text-[10px] font-bold leading-none text-white">
        {qty}
      </span>
      <img
        src={iconUrl(material.iconType)}
        alt=""
        className="h-10 w-10 object-contain"
      />
      <span className="mt-1 w-full truncate px-0.5 text-center text-[9px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

function LootSackItemSheet({
  material,
  qty,
  onSet,
  onClose,
}: {
  material: Material;
  qty: number;
  onSet: (next: number) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} className="bg-[#2a231c] text-white">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/30" />
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <img
            src={iconUrl(material.iconType)}
            alt=""
            className="h-12 w-12 object-contain"
          />
          {material.group === "monster" && material.monsterId && (
            <img
              src={iconUrl(material.monsterId)}
              alt=""
              className="h-10 w-10 object-contain"
            />
          )}
        </div>
        <div>
          <p className="font-display text-xl">{material.name}</p>
          <p className="text-xs text-white/60">Adjust loot quantity</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onSet(Math.max(0, qty - 1))}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/30 text-xl font-bold"
        >
          −
        </button>
        <span className="font-display text-3xl tabular-nums">{qty}</span>
        <button
          type="button"
          onClick={() => onSet(qty + 1)}
          className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-xl font-bold text-white"
        >
          +
        </button>
      </div>
      <Button
        variant="secondary"
        rounded="lg"
        onClick={onClose}
        className="mt-4 w-full bg-white/10 py-2 text-sm font-semibold text-white"
      >
        Done
      </Button>
    </BottomSheet>
  );
}
