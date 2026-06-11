import type { WeaponType } from "../domain/types";
import {
  ALL_WEAPONS,
  COMING_SOON_WEAPONS,
  isWeaponImplemented,
} from "../data/weapons";

interface WeaponPickerProps {
  value: WeaponType | null;
  onChange: (type: WeaponType) => void;
  /** Weapon types already taken by other hunters (join flow). */
  takenWeapons?: WeaponType[];
}

type WeaponState = "selected" | "available" | "taken" | "comingSoon";

function weaponState(
  type: WeaponType,
  selected: WeaponType | null,
  taken: Set<WeaponType>,
): WeaponState {
  if (COMING_SOON_WEAPONS.includes(type) || !isWeaponImplemented(type)) {
    return "comingSoon";
  }
  if (taken.has(type)) return "taken";
  if (selected === type) return "selected";
  return "available";
}

const STATE_LABEL: Partial<Record<WeaponState, string>> = {
  taken: "Taken",
  comingSoon: "Coming soon",
};

/** Shared weapon grid for campaign create/join screens. */
export function WeaponPicker({
  value,
  onChange,
  takenWeapons = [],
}: WeaponPickerProps) {
  const taken = new Set(takenWeapons);

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Weapon</p>
      <div className="grid grid-cols-2 gap-2">
        {ALL_WEAPONS.map((w) => {
          const state = weaponState(w.type, value, taken);
          const disabled = state === "taken" || state === "comingSoon";
          const label = STATE_LABEL[state];

          return (
            <button
              key={w.type}
              type="button"
              disabled={disabled}
              onClick={() => onChange(w.type)}
              className={`relative px-3 py-3 text-left text-sm font-semibold active:translate-y-px ${
                state === "selected"
                  ? "rounded-2xl border-[1.5px] border-accent bg-accent text-white shadow-[2px_3px_0_rgba(43,38,32,0.15)] ring-2 ring-accent/70"
                  : state === "available"
                    ? "paper-card"
                    : "paper-card opacity-40 grayscale cursor-not-allowed"
              } ${state === "taken" ? "opacity-50 grayscale" : ""}`}
            >
              <span className="block leading-tight">{w.type}</span>
              {label && (
                <span className="mt-0.5 block text-[10px] font-normal text-ink-soft">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
