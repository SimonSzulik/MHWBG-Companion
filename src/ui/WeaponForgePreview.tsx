import type { WeaponType } from "../domain/types";
import { catalog, pathsForWeapon } from "../domain/catalog";
import { FORGE_WEAPON_TYPES } from "../data/forge/ancientForestWeapons";
import { iconUrl } from "../domain/icons";
import { isWeaponImplemented } from "../data/weapons";

/** Read-only overview of weapon forge paths for a weapon type. */
export function WeaponForgePreview({ weaponType }: { weaponType: WeaponType }) {
  if (!isWeaponImplemented(weaponType)) {
    return (
      <p className="text-sm text-ink-soft">
        Schmiedepfade für diese Waffe sind noch nicht verfügbar.
      </p>
    );
  }

  if (!FORGE_WEAPON_TYPES.includes(weaponType)) {
    return (
      <p className="text-sm text-ink-soft">
        Keine Schmiedepfade für {weaponType} hinterlegt.
      </p>
    );
  }

  const paths = pathsForWeapon(weaponType);
  if (paths.length === 0) {
    return (
      <p className="text-sm text-ink-soft">Keine Schmiederezepte gefunden.</p>
    );
  }

  return (
    <div className="paper-card flex flex-col gap-3 p-4">
      <p className="text-xs uppercase tracking-wide text-accent">
        Schmiedepfade · {weaponType}
      </p>
      {paths.map((path) => (
        <div key={path.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
          <div className="mb-2 flex items-center gap-2">
            <img
              src={iconUrl(path.icon)}
              alt=""
              className="h-8 w-8 shrink-0 object-contain"
            />
            <p className="font-semibold">{path.label}</p>
          </div>
          <ol className="flex flex-col gap-1 text-sm text-ink-soft">
            {path.gearIds.map((gearId, i) => {
              const gear = catalog.gear(gearId);
              if (!gear) return null;
              return (
                <li key={gearId} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 tabular-nums text-ink">{i + 1}.</span>
                  {gear.tierIcon && (
                    <img
                      src={iconUrl(gear.tierIcon)}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span className="text-ink">{gear.name}</span>
                  {gear.isStarter && (
                    <span className="text-[10px] uppercase text-ink-soft">
                      Start
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
