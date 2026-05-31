import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, initAuthListener } from "./store/auth";
import { useCampaign } from "./store/campaign";
import { resumeSyncIfNeeded } from "./lib/sync/engine";
import { BottomNav } from "./ui/BottomNav";
import { OnlineGate } from "./ui/OnlineGate";

/** Waits for auth + campaign hydration, then resumes cloud sync. */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false);
  const authLoading = useAuth((s) => s.loading);
  const userId = useAuth((s) => s.userId);
  const hydrated = useCampaign((s) => s.hydrated);
  const campaign = useCampaign((s) => s.campaign);
  const restoreSession = useAuth((s) => s.restoreSession);

  useEffect(() => {
    const unsubAuth = initAuthListener();
    void restoreSession();
    return unsubAuth;
  }, [restoreSession]);

  useEffect(() => {
    if (!authLoading && hydrated) {
      if (userId && campaign) {
        void resumeSyncIfNeeded().finally(() => setReady(true));
      } else {
        setReady(true);
      }
    }
  }, [authLoading, hydrated, userId, campaign]);

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
  if (!campaign) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** App shell with bottom nav and online/sync gate. */
export function Shell() {
  return (
    <OnlineGate>
      <div className="relative">
        <Outlet />
        <BottomNav />
      </div>
    </OnlineGate>
  );
}
