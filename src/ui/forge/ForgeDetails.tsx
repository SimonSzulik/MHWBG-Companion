import { catalog } from "../../domain/catalog";
import type { ForgeNode } from "../../domain/catalog";
import type { DeckChanges, GearDef, Hunter } from "../../domain/types";
import { Button } from "../Button";

export function forgeNodeBadge(node: ForgeNode): { label: string; cls: string } {
  if (node.forged) {
    return node.equipped
      ? { label: "AUSGERÜSTET", cls: "bg-accent-faint text-accent" }
      : { label: "GESCHMIEDET", cls: "bg-ok-soft text-ok" };
  }
  switch (node.state) {
    case "craftable":
      return { label: "BAUBAR", cls: "bg-ok-soft text-ok" };
    case "locked":
      return { label: "GESPERRT", cls: "bg-paper-2 text-ink-soft" };
    default:
      return {
        label: node.prerequisiteMet
          ? `${Math.round(node.materialProgress * 100)}%`
          : "BASIS FEHLT",
        cls: "bg-paper-2 text-ink-soft",
      };
  }
}

export function ForgeNodeBadge({ node }: { node: ForgeNode }) {
  const { label, cls } = forgeNodeBadge(node);
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

export function CraftButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Button
      rounded="lg"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 w-full py-2 text-sm font-semibold"
    >
      {label}
    </Button>
  );
}

export function MaterialCostList({ gear, hunter }: { gear: GearDef; hunter: Hunter }) {
  if (gear.cost.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs">
      {gear.cost.map((c) => {
        const have = hunter.materials[c.materialId] ?? 0;
        const enough = have >= c.qty;
        const name = catalog.material(c.materialId)?.name ?? c.materialId;
        return (
          <li key={c.materialId} className={enough ? "text-ok" : "text-ink-soft"}>
            {enough ? "✓" : "○"} {name} {have}/{c.qty}
          </li>
        );
      })}
    </ul>
  );
}

export function DeckChangesBlock({ changes }: { changes: DeckChanges }) {
  const hasRemove = (changes.remove?.length ?? 0) > 0;
  const hasAdd = (changes.add?.length ?? 0) > 0;
  if (!hasRemove && !hasAdd) return null;

  return (
    <div className="mt-3 border-t border-line pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {hasRemove && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              Entfernen
            </p>
            <ul className="flex flex-col gap-0.5 text-[11px] leading-snug">
              {changes.remove!.map((card) => (
                <li key={card}>− {card}</li>
              ))}
            </ul>
          </div>
        )}
        {hasAdd && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              Hinzufügen
            </p>
            <ul className="flex flex-col gap-0.5 text-[11px] leading-snug">
              {changes.add!.map((card) => (
                <li key={card}>+ {card}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
