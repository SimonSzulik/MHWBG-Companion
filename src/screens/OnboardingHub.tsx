import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useCampaign } from "../store/campaign";
import {
  activateCampaign,
  listUserCampaigns,
  stopSync,
  type UserCampaignSummary,
} from "../lib/sync/engine";

/** Hub after login: continue campaigns, create, or join. */
export function OnboardingHub() {
  const nav = useNavigate();
  const username = useAuth((s) => s.username);
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const signOut = useAuth((s) => s.signOut);
  const resetCampaign = useCampaign((s) => s.resetCampaign);
  const activeCampaignId = useCampaign((s) => s.campaign?.id);

  const [campaigns, setCampaigns] = useState<UserCampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { campaigns: list, error: loadError } = await listUserCampaigns();
    setCampaigns(list);
    if (loadError) setError(loadError);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !userId) return;
    void loadCampaigns();
  }, [authLoading, userId, loadCampaigns]);

  useEffect(() => {
    const onFocus = () => {
      if (!authLoading && userId) void loadCampaigns();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [authLoading, userId, loadCampaigns]);

  const openCampaign = async (id: string) => {
    setOpeningId(id);
    setError(null);
    const ok = await activateCampaign(id);
    setOpeningId(null);
    if (!ok) {
      setError("Kampagne konnte nicht geladen werden.");
      return;
    }
    nav("/", { replace: true });
  };

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

      <div className="mt-8">
        <p className="mb-2 text-xs uppercase tracking-wide text-accent">
          Deine Kampagnen
        </p>
        {loading && (
          <p className="text-sm text-ink-soft">Lade Kampagnen…</p>
        )}
        {!loading && campaigns.length === 0 && !error && (
          <p className="paper-card px-4 py-3 text-sm text-ink-soft">
            Noch keine Kampagne — starte eine neue oder tritt einer bei.
          </p>
        )}
        {!loading && campaigns.length > 0 && (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={openingId != null}
                onClick={() => void openCampaign(c.id)}
                className={`paper-card flex w-full items-center gap-3 px-4 py-3 text-left active:translate-y-px disabled:opacity-50 ${
                  c.id === activeCampaignId ? "ring-1 ring-accent/50" : ""
                }`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-xl">
                  🏕️
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-sm text-ink-soft">
                    Tag {c.day}/{c.maxDay}
                    {c.hunterName ? ` · ${c.hunterName}` : ""}
                    {c.weaponType ? ` · ${c.weaponType}` : ""}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {c.role === "owner" ? "Ersteller" : "Spieler"} · Code{" "}
                    {c.joinCode}
                  </p>
                </div>
                <span className="shrink-0 text-ink-soft">
                  {openingId === c.id ? "…" : "›"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
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

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

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
