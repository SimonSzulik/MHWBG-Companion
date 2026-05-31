import { Link } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { wildspireWaste } from "../data/wildspireWaste";
import { craftState } from "../domain/catalog";

/**
 * Camp hub (home). Banner with the active hunter + status tiles, then a grid
 * of drill-in tiles. Mirrors the "Camp hub" mockup.
 */
export function Camp() {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  const hunter = campaign.hunters[0];
  const potions = campaign.items["potion"] ?? 0;
  const craftableCount = wildspireWaste.gear.filter(
    (g) => craftState(g, campaign) === "craftable",
  ).length;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-24 pt-5">
      {/* Banner */}
      <Link to="/hunters" className="paper-card flex items-center gap-3 p-4 active:translate-y-px">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-2xl">
          🧍
        </span>
        <div className="min-w-0">
          <p className="font-display truncate text-2xl leading-tight">
            {hunter?.name ?? "Hunter"}
          </p>
          <p className="truncate text-sm text-ink-soft">
            {hunter?.weaponType} · {campaign.hunters.length} Jäger
          </p>
        </div>
        <span className="ml-auto text-ink-soft">›</span>
      </Link>

      {/* Status tiles */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="paper-card grid place-items-center py-4 text-center">
          <p className="font-display text-3xl leading-none">Tag {campaign.day}</p>
          <p className="text-sm text-ink-soft">von {campaign.maxDay}</p>
        </div>
        <div className="paper-card grid place-items-center py-4 text-center">
          <p className="font-display text-3xl leading-none">{potions}</p>
          <p className="text-sm text-ink-soft">Tränke</p>
        </div>
      </div>

      {/* Drill-in tiles */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile to="/inventory" emoji="🎒" title="Inventar" sub="Material zählen" />
        <Tile
          to="/forge"
          emoji="🔨"
          title="Forge"
          sub={craftableCount > 0 ? `${craftableCount} baubar` : "Schmiede"}
          highlight={craftableCount > 0}
        />
        <Tile to="/campaign" emoji="🏕️" title="Kampagne" sub="Quests & Tage" />
        <Tile to="/reference" emoji="📖" title="Referenz" sub="Regeln & Skills" />
      </div>
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
