import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./store/auth";
import { useAppReady } from "./AppBootstrap";
import { AuthGuard, CampaignGuard, Shell } from "./AppBootstrap";
import { LoginScreen } from "./screens/LoginScreen";
import { OnboardingHub } from "./screens/OnboardingHub";
import { CreateCampaignScreen } from "./screens/CreateCampaignScreen";
import { JoinCampaignScreen } from "./screens/JoinCampaignScreen";
import { Camp } from "./screens/Camp";
import { Hunters } from "./screens/Hunters";
import { Inventory } from "./screens/Inventory";
import { Forge } from "./screens/Forge";
import { CampaignScreen } from "./screens/CampaignScreen";
import { QuestScreen } from "./screens/QuestScreen";
import { QuestFlowScreen } from "./screens/QuestFlowScreen";
import { DowntimeScreen } from "./screens/DowntimeScreen";
import { Reference } from "./screens/Reference";
import { Settings } from "./screens/Settings";

function LoginRoute() {
  const userId = useAuth((s) => s.userId);
  if (userId) return <Navigate to="/onboarding" replace />;
  return <LoginScreen />;
}

function OnboardingRoute() {
  return (
    <AuthGuard>
      <OnboardingHub />
    </AuthGuard>
  );
}

export default function App() {
  const ready = useAppReady();
  if (!ready) {
    return (
      <div className="grid min-h-[100dvh] place-items-center text-sm text-ink-soft">
        Lade…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/onboarding"
          element={<OnboardingRoute />}
        />
        <Route
          path="/onboarding/new"
          element={
            <AuthGuard>
              <CreateCampaignScreen />
            </AuthGuard>
          }
        />
        <Route
          path="/onboarding/join"
          element={
            <AuthGuard>
              <JoinCampaignScreen />
            </AuthGuard>
          }
        />
        <Route
          element={
            <AuthGuard>
              <CampaignGuard>
                <Shell />
              </CampaignGuard>
            </AuthGuard>
          }
        >
          <Route path="/" element={<Camp />} />
          <Route path="/hunters" element={<Hunters />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/campaign" element={<CampaignScreen />} />
          <Route path="/campaign/quests" element={<QuestScreen />} />
          <Route path="/campaign/quest" element={<QuestFlowScreen />} />
          <Route path="/campaign/downtime" element={<DowntimeScreen />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
