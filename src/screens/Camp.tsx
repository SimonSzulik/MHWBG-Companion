import { Link } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { gameData } from "../data/gameData";
import { catalog, craftState } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearSlot, Hunter } from "../domain/types";

const EQUIP_SLOTS: GearSlot[] = ["weapon", "head", "chest", "legs"];

/**
 * Camp hub (home). Banner with the active hunter + status tiles, then a grid
 * of drill-in tiles. Mirrors the "Camp hub" mockup.
 */
export function Camp() {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  const hunter = campaign.hunters[0];
  const potions = campaign.items["potion"] ?? 0;
  const craftableCount = gameData.gear.filter(
    (g) => craftState(g, campaign) === "craftable",
  ).length;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-24 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-lg text-ink-soft">{campaign.name}</p>
        <Link
          to="/settings"
          aria-label="Einstellungen"
          className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-line-strong bg-card text-lg active:translate-y-px"
        >
          ⚙
        </Link>
      </div>

      <Link to="/hunters" className="paper-card flex items-center gap-3 p-4 active:translate-y-px">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-2xl">
          🧍
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-2xl leading-tight">
            {hunter?.name ?? "Hunter"}
          </p>
          <p className="truncate text-sm text-ink-soft">
            {hunter?.weaponType} · {campaign.hunters.length} Jäger
          </p>
          {hunter && <EquippedIconRow hunter={hunter} />}
        </div>
        <span className="ml-auto text-ink-soft">›</span>
      </Link>

      <Link
        to="/campaign"
        className="paper-card mt-3 flex items-center gap-4 p-5 active:translate-y-px"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-[1.5px] border-line-strong bg-paper-2 text-3xl">
          🏕️
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold leading-tight">Kampagne</p>
          <p className="mt-1 text-sm text-ink-soft">
            Tag {campaign.day} / {campaign.maxDay} · {potions} Tränke
          </p>
        </div>
        <span className="text-xl text-ink-soft">›</span>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile to="/inventory" emoji="🎒" title="Inventar" sub="Material zählen" />
        <Tile
          to="/forge"
          emoji="🔨"
          title="Forge"
          sub={craftableCount > 0 ? `${craftableCount} baubar` : "Schmiede"}
          highlight={craftableCount > 0}
        />
        <Tile to="/reference" emoji="📖" title="Referenz" sub="Regeln & Skills" />
      </div>
    </div>
  );
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

function Tile({
  to,
  emoji,
  title,
  sub,
  highlight,
}: {
  to: string;
  emoji: string;
  title: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`paper-card flex flex-col gap-2 p-4 active:translate-y-px ${
        highlight ? "bg-accent-faint" : ""
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-line-strong bg-paper-2 text-xl">
        {emoji}
      </span>
      <span className="font-semibold leading-tight">{title}</span>
      <span className="text-xs text-ink-soft">{sub}</span>
    </Link>
  );
}
