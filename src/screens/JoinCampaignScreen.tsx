import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { Screen } from "../ui/Screen";
import { WeaponPicker } from "../ui/WeaponPicker";
import { useAuth } from "../store/auth";
import { isWeaponImplemented } from "../data/weapons";
import { isValidJoinCode, normalizeJoinCode } from "../lib/joinCode";
import {
  activateCampaign,
  joinCampaignWithHunter,
  listUserCampaigns,
  peekJoinCampaign,
} from "../lib/sync/engine";

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
  const [existingCampaignId, setExistingCampaignId] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeValid = isValidJoinCode(joinCode);

  const validateCode = async () => {
    if (!navigator.onLine) {
      setError("Internetverbindung erforderlich.");
      return;
    }
    if (!codeValid) {
      setError("Join-Code muss 8 Zeichen haben (z. B. A1B2C3D4).");
      return;
    }
    setBusy(true);
    setError(null);
    setExistingCampaignId(null);
    const normalized = joinCode.trim().toUpperCase();

    const { campaigns } = await listUserCampaigns();
    const known = campaigns.find((c) => c.joinCode === normalized);
    if (known) {
      setBusy(false);
      setExistingCampaignId(known.id);
      setError("Du nimmst bereits an dieser Kampagne teil.");
      return;
    }

    const peek = await peekJoinCampaign(normalized);
    setBusy(false);
    if (!peek.ok) {
      setError(peek.error);
      return;
    }
    if (peek.data.alreadyMember) {
      setExistingCampaignId(peek.data.campaignId);
      setError("Du nimmst bereits an dieser Kampagne teil.");
      return;
    }
    setTakenWeapons(peek.data.takenWeapons);
    setStep("setup");
  };

  const openExistingCampaign = async () => {
    if (!existingCampaignId) return;
    setBusy(true);
    setError(null);
    const ok = await activateCampaign(existingCampaignId);
    setBusy(false);
    if (!ok) {
      setError("Kampagne konnte nicht geöffnet werden.");
      return;
    }
    nav("/", { replace: true });
  };

  const confirm = async () => {
    if (!weaponType || !isWeaponImplemented(weaponType)) return;
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
              onChange={(e) => setJoinCode(normalizeJoinCode(e.target.value))}
              placeholder="z. B. A1B2C3D4"
              maxLength={8}
              className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 font-display tracking-widest uppercase outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {existingCampaignId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void openExistingCampaign()}
              className="rounded-lg border-[1.5px] border-line-strong bg-card py-2.5 text-sm font-semibold active:translate-y-px"
            >
              Kampagne öffnen
            </button>
          )}
          <button
            type="button"
            disabled={busy || !codeValid}
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

          <WeaponPicker
            value={weaponType}
            onChange={setWeaponType}
            takenWeapons={takenWeapons}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={
              busy ||
              !weaponType ||
              !isWeaponImplemented(weaponType) ||
              takenWeapons.includes(weaponType) ||
              !hunterName.trim()
            }
            onClick={() => void confirm()}
            className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2.5 font-semibold text-white active:translate-y-px disabled:opacity-40"
          >
            {busy ? "Beitreten…" : "Beitreten"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("code");
              setWeaponType(null);
              setError(null);
              setExistingCampaignId(null);
            }}
            className="text-sm text-ink-soft underline"
          >
            ← Anderen Code eingeben
          </button>
        </div>
      )}
    </Screen>
  );
}
