import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useCampaign } from "../store/campaign";
import { stopSync } from "../lib/sync/engine";

/** Hub after login: create or join a campaign. */
export function OnboardingHub() {
  const nav = useNavigate();
  const username = useAuth((s) => s.username);
  const signOut = useAuth((s) => s.signOut);
  const resetCampaign = useCampaign((s) => s.resetCampaign);

  const logout = async () => {
    await stopSync();
    resetCampaign();
    await signOut();
    nav("/login", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-8">
      <h1 className="font-display text-3xl">Willkommen</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {username ? `Jäger ${username}` : "Eingeloggt"}
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          to="/onboarding/new"
          className="paper-card px-4 py-5 text-center font-semibold active:translate-y-px"
        >
          Neue Kampagne starten
        </Link>
        <Link
          to="/onboarding/join"
          className="paper-card px-4 py-5 text-center font-semibold active:translate-y-px"
        >
          Kampagne beitreten
        </Link>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-auto pt-8 text-sm text-ink-soft underline"
      >
        Abmelden
      </button>
    </div>
  );
}
