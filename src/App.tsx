import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useCampaign } from "./store/campaign";
import { BottomNav } from "./ui/BottomNav";
import { Onboarding } from "./screens/Onboarding";
import { Camp } from "./screens/Camp";
import { Hunters } from "./screens/Hunters";
import { Inventory } from "./screens/Inventory";
import { Forge } from "./screens/Forge";
import { CampaignScreen } from "./screens/CampaignScreen";
import { Reference } from "./screens/Reference";
import { Settings } from "./screens/Settings";

/**
 * Shell with persistent bottom nav. Guards routes behind an existing
 * campaign — first run sends the player through onboarding.
 */
function Shell() {
  const hasCampaign = useCampaign((s) => s.campaign !== null);
  if (!hasCampaign) return <Navigate to="/onboarding" replace />;
  return (
    <div className="relative">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Shell />}>
          <Route path="/" element={<Camp />} />
          <Route path="/hunters" element={<Hunters />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/campaign" element={<CampaignScreen />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
