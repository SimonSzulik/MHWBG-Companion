import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { Screen } from "../ui/Screen";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
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
          <Field
            label="Join-Code"
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeJoinCode(e.target.value))}
            placeholder="z. B. A1B2C3D4"
            maxLength={8}
            className="font-display tracking-widest uppercase"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {existingCampaignId && (
            <Button
              variant="secondary"
              rounded="lg"
              disabled={busy}
              onClick={() => void openExistingCampaign()}
              className="bg-card py-2.5 text-sm font-semibold"
            >
              Kampagne öffnen
            </Button>
          )}
          <Button
            rounded="lg"
            disabled={busy || !codeValid}
            onClick={() => void validateCode()}
            className="py-2.5 font-semibold"
          >
            {busy ? "Prüfe…" : "Weiter"}
          </Button>
        </div>
      )}

      {step === "setup" && (
        <div className="flex flex-col gap-4">
          <Field
            label="Jägername"
            value={hunterName}
            onChange={(e) => setHunterName(e.target.value)}
          />

          <WeaponPicker
            value={weaponType}
            onChange={setWeaponType}
            takenWeapons={takenWeapons}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            rounded="lg"
            disabled={
              busy ||
              !weaponType ||
              !isWeaponImplemented(weaponType) ||
              takenWeapons.includes(weaponType) ||
              !hunterName.trim()
            }
            onClick={() => void confirm()}
            className="py-2.5 font-semibold"
          >
            {busy ? "Beitreten…" : "Beitreten"}
          </Button>

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
