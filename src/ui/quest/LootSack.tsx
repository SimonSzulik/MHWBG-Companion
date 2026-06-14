import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import type { Material } from "../../domain/types";

/** Loot bag grid for quest looting — read-only view of what was rolled. */
export function LootSack({
  quantities,
}: {
  quantities: Record<string, number>;
}) {
  const materialIds = Object.keys(quantities)
    .filter((id) => (quantities[id] ?? 0) > 0)
    .sort();

  if (materialIds.length === 0) return null;

  return (
    <div className="paper-card p-4">
      <p className="mb-3 font-display text-lg">Loot</p>
      <div className="grid grid-cols-4 gap-2">
        {materialIds.map((id) => {
          const material = catalog.material(id);
          const qty = quantities[id] ?? 0;
          if (!material) return null;
          return <LootSackTile key={id} material={material} qty={qty} />;
        })}
      </div>
    </div>
  );
}

function LootSackTile({
  material,
  qty,
}: {
  material: Material;
  qty: number;
}) {
  const label = material.shortName ?? material.name;
  return (
    <div className="relative flex flex-col items-center rounded-xl border-[1.5px] border-line-strong bg-card px-1 pb-1.5 pt-2">
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
    </div>
  );
}
