import type { WeaponType } from "../domain/types";
import {
  ALL_WEAPONS,
  COMING_SOON_WEAPONS,
  isWeaponImplemented,
} from "../data/weapons";
import { iconUrl } from "../domain/icons";

/** White-tier forge icon stem for each weapon type. */
const WEAPON_ICON: Record<WeaponType, string> = {
  "Great Sword": "white-great-sword",
  "Sword & Shield": "white-sword-shield",
  Bow: "white-bow",
  "Dual Blades": "white-dual-blades",
  "Long Sword": "white-long-sword",
  Hammer: "white-hammer",
  Gunlance: "white-gunlance",
  "Light Bowgun": "white-light-bowgun",
  Lance: "white-lance",
  "Hunting Horn": "white-hunting-horn",
  "Switch Axe": "white-switch-axe",
  "Charge Blade": "white-charge-blade",
  "Insect Glaive": "white-insect-glaive",
  "Heavy Bowgun": "white-heavy-bowgun",
};

interface WeaponPickerProps {
  value: WeaponType | null;
  onChange: (type: WeaponType) => void;
  /** Weapon types already taken by other hunters (join flow). */
  takenWeapons?: WeaponType[];
  /**
   * Weapon types the campaign's boxes provide. Omitted means "all implemented",
   * which is what the join flow wants — it reads the campaign that already
   * exists rather than choosing boxes.
   */
  available?: WeaponType[];
}

type WeaponState =
  | "selected"
  | "available"
  | "taken"
  | "comingSoon"
  | "needsBox";

function weaponState(
  type: WeaponType,
  selected: WeaponType | null,
  taken: Set<WeaponType>,
  available: Set<WeaponType> | null,
): WeaponState {
  if (COMING_SOON_WEAPONS.includes(type) || !isWeaponImplemented(type)) {
    return "comingSoon";
  }
  if (available && !available.has(type)) return "needsBox";
  if (taken.has(type)) return "taken";
  if (selected === type) return "selected";
  return "available";
}

const STATE_LABEL: Partial<Record<WeaponState, string>> = {
  taken: "Taken",
  comingSoon: "Coming soon",
  needsBox: "Hunter's Arsenal",
};

/** Shared weapon grid for campaign create/join screens. */
export function WeaponPicker({
  value,
  onChange,
  takenWeapons = [],
  available,
}: WeaponPickerProps) {
  const taken = new Set(takenWeapons);
  const availableSet = available ? new Set(available) : null;

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Weapon</p>
      <div className="grid grid-cols-2 gap-2">
        {ALL_WEAPONS.map((w) => {
          const state = weaponState(w.type, value, taken, availableSet);
          const disabled =
            state === "taken" ||
            state === "comingSoon" ||
            state === "needsBox";
          const label = STATE_LABEL[state];

          return (
            <button
              key={w.type}
              type="button"
              disabled={disabled}
              onClick={() => onChange(w.type)}
              className={`relative flex items-center gap-2.5 px-3 py-3 text-left text-sm font-semibold active:translate-y-px ${
                state === "selected"
                  ? "rounded-2xl border-[1.5px] border-accent bg-accent text-white shadow-[2px_3px_0_rgba(43,38,32,0.15)] ring-2 ring-accent/70"
                  : state === "available"
                    ? "paper-card"
                    : "paper-card opacity-40 grayscale cursor-not-allowed"
              } ${state === "taken" ? "opacity-50 grayscale" : ""}`}
            >
              <img
                src={iconUrl(WEAPON_ICON[w.type])}
                alt=""
                className={`h-8 w-8 shrink-0 object-contain ${
                  state === "selected" ? "brightness-0 invert" : ""
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block leading-tight">{w.type}</span>
                {label && (
                  <span className="mt-0.5 block text-[10px] font-normal text-ink-soft">
                    {label}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
