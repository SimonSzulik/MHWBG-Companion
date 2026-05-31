import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { Material } from "../domain/types";

function CompactStepper({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <span className="w-5 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange?.(Math.max(0, value - 1))}
        aria-label="weniger"
        disabled={value <= 0}
        className="grid h-7 w-7 place-items-center rounded border-[1.5px] border-line-strong bg-paper-2 text-sm font-bold active:translate-y-px disabled:opacity-40"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange?.(value + 1)}
        aria-label="mehr"
        className="grid h-7 w-7 place-items-center rounded border-[1.5px] border-line-strong bg-accent text-sm font-bold text-white active:translate-y-px"
      >
        +
      </button>
    </div>
  );
}

export function LootMaterialRow({
  materialId,
  qty,
  onSet,
  readOnly,
  compact,
}: {
  materialId: string;
  qty: number;
  onSet?: (next: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const material: Material | undefined = catalog.material(materialId);
  const name = material?.shortName ?? material?.name ?? materialId;

  return (
    <div
      className={`flex items-center justify-between gap-2 ${compact ? "py-0.5" : "py-1"}`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {material && (
          <div className="flex shrink-0 items-center gap-0.5">
            <img
              src={iconUrl(material.iconType)}
              alt=""
              className={`object-contain ${compact ? "h-4 w-4" : "h-5 w-5"}`}
            />
            {material.group === "monster" && material.monsterId && (
              <img
                src={iconUrl(material.monsterId)}
                alt=""
                className={`object-contain ${compact ? "h-4 w-4" : "h-5 w-5"}`}
              />
            )}
          </div>
        )}
        <span
          className={`min-w-0 truncate font-medium ${compact ? "text-xs" : "text-sm"}`}
        >
          {name}
        </span>
      </div>
      <CompactStepper
        value={qty}
        onChange={onSet}
        readOnly={readOnly}
      />
    </div>
  );
}

export function LootMaterialPreviewList({
  quantities,
  readOnly,
  compact,
}: {
  quantities: Record<string, number>;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-col gap-0.5">
      {entries.map(([id, qty]) => (
        <li key={id}>
          <LootMaterialRow
            materialId={id}
            qty={qty}
            readOnly={readOnly}
            compact={compact}
          />
        </li>
      ))}
    </ul>
  );
}
