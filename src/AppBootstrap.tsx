import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, initAuthListener } from "./store/auth";
import { useCampaign } from "./store/campaign";
import { resumeSyncIfNeeded } from "./lib/sync/engine";
import { ownHunter } from "./lib/hunter";
import { BottomNav } from "./ui/BottomNav";
import { OnlineGate } from "./ui/OnlineGate";
import { QuestInvitePopup } from "./ui/QuestInvitePopup";

/** Waits for auth + campaign store hydration. */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false);
  const authLoading = useAuth((s) => s.loading);
  const hydrated = useCampaign((s) => s.hydrated);
  const restoreSession = useAuth((s) => s.restoreSession);

  useEffect(() => {
    const unsubAuth = initAuthListener();
    void restoreSession();
    return unsubAuth;
  }, [restoreSession]);

  useEffect(() => {
    if (!authLoading && hydrated) {
      setReady(true);
    }
  }, [authLoading, hydrated]);

  return ready;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const loading = useAuth((s) => s.loading);
  const userId = useAuth((s) => s.userId);
  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center text-sm text-ink-soft">
        Lade…
      </div>
    );
  }
  if (!userId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function CampaignGuard({ children }: { children: ReactNode }) {
  const campaign = useCampaign((s) => s.campaign);
  const userId = useAuth((s) => s.userId);
  const [booting, setBooting] = useState(Boolean(campaign));

  useEffect(() => {
    if (!campaign) {
      setBooting(false);
      return;
    }
    let cancelled = false;
    setBooting(true);
    void resumeSyncIfNeeded().finally(() => {
      if (!cancelled) setBooting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [campaign?.id]);

  if (!campaign) return <Navigate to="/onboarding" replace />;
  if (!booting && userId && !ownHunter(campaign, userId)) {
    return <Navigate to="/onboarding" replace />;
  }
  if (booting) {
    return (
      <div className="grid min-h-[100dvh] place-items-center text-sm text-ink-soft">
        Lade Kampagne…
      </div>
    );
  }
  return <>{children}</>;
}

/** Leave quest lobby when navigating away via bottom tabs (re-shows invite popup). */
function QuestLobbyNavGuard() {
  const location = useLocation();
  const userId = useAuth((s) => s.userId);
  const campaign = useCampaign((s) => s.campaign);
  const leaveQuestLobby = useCampaign((s) => s.leaveQuestLobby);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const from = prevPath.current;
    const to = location.pathname;
    prevPath.current = to;

    if (from !== "/campaign/quest" || to === "/campaign/quest") return;
    const aq = campaign?.activeQuest;
    if (!aq || aq.phase !== "lobby" || !userId) return;

    const hunter = ownHunter(campaign, userId);
    if (!hunter || !aq.readyHunterIds.includes(hunter.id)) return;

    leaveQuestLobby(hunter.id);
  }, [location.pathname, campaign, userId, leaveQuestLobby]);

  return null;
}

/** App shell with bottom nav and online/sync gate. */
export function Shell() {
  return (
    <OnlineGate>
      <div className="relative">
        <Outlet />
        <QuestLobbyNavGuard />
        <QuestInvitePopup />
        <BottomNav />
      </div>
    </OnlineGate>
  );
}
