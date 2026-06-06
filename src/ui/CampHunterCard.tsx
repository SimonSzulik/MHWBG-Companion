import { Link } from "react-router-dom";
import { catalog, hunterTotalDefense } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearSlot, Hunter } from "../domain/types";

const ARMOR_SLOTS: GearSlot[] = ["head", "chest", "legs"];

/** Camp home banner: weapon prominent beside name, armor row below. */
export function CampHunterCard({ hunter }: { hunter: Hunter }) {
  const weaponId = hunter.equipped.weapon;
  const weapon = weaponId ? catalog.gear(weaponId) : undefined;
  const totalDef = hunterTotalDefense(hunter);

  return (
    <Link
      to="/hunters"
      className="paper-card flex gap-3 p-4 ring-1 ring-accent/40 active:translate-y-px"
    >
      <div className="flex shrink-0 items-start pt-0.5">
        {weapon?.tierIcon ? (
          <img
            src={iconUrl(weapon.tierIcon)}
            alt=""
            className="h-14 w-14 object-contain"
          />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-line bg-paper-2 text-2xl">
            ⚔
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-display text-2xl leading-tight">
            {hunter.name}
          </p>
          <p className="shrink-0 text-sm text-ink-soft">
            <span className="font-display text-lg text-ink">{totalDef}</span>{" "}
            Verteidigung
          </p>
        </div>

        <div className="mt-2 flex gap-1.5">
          {ARMOR_SLOTS.map((slot) => {
            const gearId = hunter.equipped[slot];
            const gear = gearId ? catalog.gear(gearId) : undefined;
            if (gear?.tierIcon) {
              return (
                <img
                  key={slot}
                  src={iconUrl(gear.tierIcon)}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              );
            }
            return (
              <span
                key={slot}
                className="grid h-7 w-7 place-items-center rounded-md border border-dashed border-line bg-paper-2 text-[9px] text-ink-soft"
              >
                {slot === "head" ? "H" : slot === "chest" ? "M" : "G"}
              </span>
            );
          })}
        </div>
      </div>

      <span className="shrink-0 self-center text-ink-soft">›</span>
    </Link>
  );
}
