import type { ExpansionId } from "../domain/types";
import { SELECTABLE_EXPANSIONS } from "../data/expansions";

/**
 * Which physical boxes the group owns. Mirrors `WeaponPicker`'s card styling.
 *
 * Unticking a box only hides what it *offers* — quests and weapon choices.
 * Materials and gear already owned are never removed, so this is safe to change
 * mid-campaign.
 */
export function BoxPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: ExpansionId[];
  onChange: (boxes: ExpansionId[]) => void;
  disabled?: boolean;
}) {
  const owned = new Set(value);

  const toggle = (id: ExpansionId) => {
    const next = new Set(owned);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // "core" is implicit and always present.
    next.add("core");
    onChange([...next]);
  };

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">
        Boxes you own
      </p>
      <div className="flex flex-col gap-2">
        {SELECTABLE_EXPANSIONS.map((e) => {
          const on = owned.has(e.id);
          return (
            <button
              key={e.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(e.id)}
              aria-pressed={on}
              // Named explicitly: the box name also appears on the weapon tiles
              // it unlocks, so the default accessible name is ambiguous.
              aria-label={`Box: ${e.name}`}
              className={`flex items-start gap-3 px-3 py-3 text-left active:translate-y-px disabled:opacity-50 ${
                on
                  ? "rounded-2xl border-[1.5px] border-accent bg-accent-faint ring-1 ring-accent"
                  : "paper-card"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-[1.5px] text-xs font-bold ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-line-strong bg-paper-2 text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-tight">{e.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
                  {e.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
