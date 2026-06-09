import { catalog, hunterTotalDefense } from "../../domain/catalog";
import type { Hunter } from "../../domain/types";

/** Compact defence + active skills under the loadout bar. */
export function LoadoutStats({ hunter }: { hunter: Hunter }) {
  const totalDef = hunterTotalDefense(hunter);
  const skills = Object.values(hunter.equipped)
    .map((id) => (id ? catalog.gear(id) : undefined))
    .map((g) => g?.effect)
    .filter((effect): effect is string => Boolean(effect));

  return (
    <div className="paper-card mt-3 px-3 py-2.5">
      <p className="text-sm text-ink-soft">
        <span className="font-display text-xl text-ink">{totalDef}</span> Verteidigung
      </p>
      {skills.length > 0 && (
        <div className="mt-2 max-h-12 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wide text-accent">Skills</p>
          <ul className="mt-0.5 flex flex-col gap-0.5 text-xs leading-snug">
            {skills.map((skill, i) => (
              <li key={i}>• {skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
