import { Link } from "react-router-dom";
import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearSlot, Hunter } from "../domain/types";

const EQUIP_SLOTS: GearSlot[] = ["weapon", "head", "chest", "legs"];

interface HunterSummaryCardProps {
  hunter: Hunter;
  subtitle?: string;
  /** When set, the card links to this route (e.g. own hunter → /hunters). */
  to?: string;
  isSelf?: boolean;
}

/** Compact hunter overview — name, weapon, equipped gear icons. */
export function HunterSummaryCard({
  hunter,
  subtitle,
  to,
  isSelf,
}: HunterSummaryCardProps) {
  const sub =
    subtitle ??
    [hunter.weaponType, hunter.palicoName ? `Palico ${hunter.palicoName}` : null]
      .filter(Boolean)
      .join(" · ");

  const body = (
    <>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-2xl">
        🧍
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-2xl leading-tight">
          {hunter.name}
          {isSelf && (
            <span className="ml-1.5 text-sm font-normal text-ink-soft">(Du)</span>
          )}
        </p>
        <p className="truncate text-sm text-ink-soft">{sub}</p>
        <EquippedIconRow hunter={hunter} />
      </div>
      {to && <span className="ml-auto text-ink-soft">›</span>}
    </>
  );

  const className = `paper-card flex items-center gap-3 p-4 active:translate-y-px ${
    isSelf ? "ring-1 ring-accent/40" : ""
  }`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function EquippedIconRow({ hunter }: { hunter: Hunter }) {
  return (
    <div className="mt-2 flex gap-1.5">
      {EQUIP_SLOTS.map((slot) => {
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
            {slot === "weapon" ? "⚔" : slot === "head" ? "H" : slot === "chest" ? "M" : "G"}
          </span>
        );
      })}
    </div>
  );
}
