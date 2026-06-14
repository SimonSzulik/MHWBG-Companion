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
      setError("Internet connection required.");
      return;
    }
    if (!codeValid) {
      setError("Join code must be 8 characters (e.g. A1B2C3D4).");
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
      setError("You are already in this campaign.");
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
      setError("You are already in this campaign.");
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
      setError("Could not open campaign.");
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
      username || "Hunter",
      weaponType,
    );
    setBusy(false);
    if (!ok) {
      setError("Join failed. Check code or weapon.");
      return;
    }
    nav("/", { replace: true });
  };

  return (
    <Screen title="Join campaign" subtitle={step === "code" ? "Join code" : "Weapon"}>
      {step === "code" && (
        <div className="flex flex-col gap-4">
          <Field
            label="Join code"
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeJoinCode(e.target.value))}
            placeholder="e.g. A1B2C3D4"
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
              Open campaign
            </Button>
          )}
          <Button
            rounded="lg"
            disabled={busy || !codeValid}
            onClick={() => void validateCode()}
            className="py-2.5 font-semibold"
          >
            {busy ? "Checking…" : "Next"}
          </Button>
        </div>
      )}

      {step === "setup" && (
        <div className="flex flex-col gap-4">
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
              takenWeapons.includes(weaponType)
            }
            onClick={() => void confirm()}
            className="py-2.5 font-semibold"
          >
            {busy ? "Joining…" : "Join"}
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
            ← Enter a different code
          </button>
        </div>
      )}
    </Screen>
  );
}
