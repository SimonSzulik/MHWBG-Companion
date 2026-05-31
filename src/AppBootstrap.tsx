import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
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
    if (!campaign) return;
    // #region agent log
    fetch("http://127.0.0.1:7881/ingest/a7cdc541-ed7c-4afe-87a4-662a27c5f95a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5a8220",
      },
      body: JSON.stringify({
        sessionId: "5a8220",
        runId: "pre-fix",
        hypothesisId: "E",
        location: "AppBootstrap.tsx:CampaignGuard",
        message: "campaign guard active",
        data: {
          authUserId: userId,
          campaignId: campaign.id,
          persistedId: localStorage.getItem("mhwbg-active-campaign-id"),
          hunterUserIds: campaign.hunters.map((h) => ({
            id: h.id,
            userId: h.userId ?? null,
          })),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [campaign?.id, userId]);

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

/** App shell with bottom nav and online/sync gate. */
export function Shell() {
  return (
    <OnlineGate>
      <div className="relative">
        <Outlet />
        <QuestInvitePopup />
        <BottomNav />
      </div>
    </OnlineGate>
  );
}
