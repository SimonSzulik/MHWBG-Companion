import { useNavigate, useLocation } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import { questById } from "../domain/quests";
import { iconUrl } from "../domain/icons";

/** Top-right popup inviting player to join an active quest lobby. */
export function QuestInvitePopup() {
  const campaign = useCampaign((s) => s.campaign);
  const joinQuest = useCampaign((s) => s.joinQuest);
  const userId = useAuth((s) => s.userId);
  const navigate = useNavigate();
  const location = useLocation();

  if (!campaign?.activeQuest) return null;
  if (campaign.activeDowntime) return null;
  if (campaign.activeQuest.phase !== "lobby") return null;
  if (location.pathname === "/campaign/quest") return null;

  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;
  if (campaign.activeQuest.readyHunterIds.includes(hunter.id)) return null;

  const quest = questById(campaign.activeQuest.questId);
  if (!quest) return null;

  const handleJoin = () => {
    const res = joinQuest(hunter.id);
    if (!res.ok) {
      alert(res.reason ?? "Could not join quest.");
      return;
    }
    navigate("/campaign/quest");
  };

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 max-w-[calc(100vw-1.5rem)] sm:right-4 sm:top-4">
      <div className="pointer-events-auto paper-card flex items-center gap-3 border-accent p-3 shadow-lg ring-1 ring-accent">
        <img
          src={iconUrl(quest.icon)}
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-accent">Quest</p>
          <p className="truncate text-sm font-semibold">{quest.name}</p>
        </div>
        <button
          type="button"
          onClick={handleJoin}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white active:translate-y-px"
        >
          Beitreten
        </button>
      </div>
    </div>
  );
}
