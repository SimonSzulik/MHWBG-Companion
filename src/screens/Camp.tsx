import { Link } from "react-router-dom";
import { useOwnHunter } from "../store/hooks";
import { ScreenBackground } from "../ui/ScreenBackground";
import { CampHunterCard } from "../ui/CampHunterCard";
import { CampaignPanel } from "../ui/CampaignPanel";

/** Camp hub: own hunter banner, campaign calendar, quest/downtime entry. */
export function Camp() {
  const { campaign, hunter } = useOwnHunter();
  if (!campaign) return null;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-24 pt-5">
      <ScreenBackground src="/backgrounds/camp.svg" />
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

      {hunter && <CampHunterCard hunter={hunter} />}

      <CampaignPanel />
    </div>
  );
}
