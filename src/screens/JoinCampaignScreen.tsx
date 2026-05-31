import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { Screen } from "../ui/Screen";
import { useAuth } from "../store/auth";
import { ALL_WEAPONS } from "../data/weapons";
import { peekJoinCampaign, joinCampaignWithHunter } from "../lib/sync/engine";

type Step = "code" | "setup";

/** Join an existing campaign via join code. */
export function JoinCampaignScreen() {
  const nav = useNavigate();
  const username = useAuth((s) => s.username);

  const [step, setStep] = useState<Step>("code");
  const [joinCode, setJoinCode] = useState("");
  const [hunterName, setHunterName] = useState(username ?? "");
  const [weaponType, setWeaponType] = useState<WeaponType | null>(null);
  const [takenWeapons, setTakenWeapons] = useState<WeaponType[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = ALL_WEAPONS.filter((w) => !takenWeapons.includes(w.type));

  const validateCode = async () => {
    if (!navigator.onLine) {
      setError("Internetverbindung erforderlich.");
      return;
    }
    setBusy(true);
    setError(null);
    const peek = await peekJoinCampaign(joinCode.trim());
    setBusy(false);
    if (!peek) {
      setError("Kampagne nicht gefunden.");
      return;
    }
    setTakenWeapons(peek.takenWeapons);
    const avail = ALL_WEAPONS.filter((w) => !peek.takenWeapons.includes(w.type));
    if (avail.length === 0) {
      setError("Alle Waffen sind bereits belegt.");
    }
    setStep("setup");
  };

  const confirm = async () => {
    if (!weaponType) return;
    setBusy(true);
    setError(null);
    const ok = await joinCampaignWithHunter(
      joinCode.trim(),
      hunterName.trim() || username || "Hunter",
      weaponType,
    );
    setBusy(false);
    if (!ok) {
      setError("Beitritt fehlgeschlagen. Code oder Waffe prüfen.");
      return;
    }
    nav("/", { replace: true });
  };

  return (
    <Screen title="Kampagne beitreten" subtitle={step === "code" ? "Join-Code" : "Jäger"}>
      {step === "code" && (
        <div className="flex flex-col gap-4">
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              Join-Code
            </span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="z.B. MHW-7Q2K"
              className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 uppercase outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy || joinCode.trim().length < 4}
            onClick={() => void validateCode()}
            className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2.5 font-semibold text-white active:translate-y-px disabled:opacity-40"
          >
            {busy ? "Prüfe…" : "Weiter"}
          </button>
        </div>
      )}

      {step === "setup" && (
        <div className="flex flex-col gap-4">
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              Jägername
            </span>
            <input
              value={hunterName}
              onChange={(e) => setHunterName(e.target.value)}
              className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
            />
          </label>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Waffe</p>
            {available.length === 0 ? (
              <p className="text-sm text-ink-soft">Keine freien Waffen.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {available.map((w) => (
                  <button
                    key={w.type}
                    type="button"
                    onClick={() => setWeaponType(w.type)}
                    className={`paper-card px-3 py-3 text-left text-sm font-semibold active:translate-y-px ${
                      weaponType === w.type
                        ? "ring-2 ring-accent bg-accent-faint"
                        : ""
                    }`}
                  >
                    {w.type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={busy || !weaponType || !hunterName.trim()}
            onClick={() => void confirm()}
            className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2.5 font-semibold text-white active:translate-y-px disabled:opacity-40"
          >
            {busy ? "Beitreten…" : "Beitreten"}
          </button>
        </div>
      )}
    </Screen>
  );
}
