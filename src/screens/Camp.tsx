import { Link } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { gameData } from "../data/gameData";
import { craftState } from "../domain/catalog";
import { ownHunter } from "../lib/hunter";
import { HunterSummaryCard } from "../ui/HunterSummaryCard";

/**
 * Camp hub (home). Banner with the active hunter + status tiles, then a grid
 * of drill-in tiles. Mirrors the "Camp hub" mockup.
 */
export function Camp() {
  const campaign = useCampaign((s) => s.campaign);
  const userId = useAuth((s) => s.userId);
  if (!campaign) return null;

  const hunter = ownHunter(campaign, userId);
  const potions = campaign.items["potion"] ?? 0;
  const craftableCount = hunter
    ? gameData.gear.filter((g) => {
        if (craftState(g, hunter) !== "craftable") return false;
        if (g.slot === "weapon") return g.weaponType === hunter.weaponType;
        return true;
      }).length
    : 0;

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

      {hunter && (
        <HunterSummaryCard
          hunter={hunter}
          to="/hunters"
          isSelf
          subtitle={`${hunter.weaponType} · ${campaign.hunters.length} Jäger`}
        />
      )}

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
        <Tile
          to="/reference"
          emoji="📖"
          title="Quick Guide"
          sub="Regeln schnell finden"
        />
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
