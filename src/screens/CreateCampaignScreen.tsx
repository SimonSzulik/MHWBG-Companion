import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { Screen } from "../ui/Screen";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { Stepper } from "../ui/Stepper";
import { WeaponPicker } from "../ui/WeaponPicker";
import { useAuth } from "../store/auth";
import { useCampaign } from "../store/campaign";
import { isWeaponImplemented } from "../data/weapons";
import { randomPalicoName } from "../data/palicoNames";
import { isValidJoinCode, normalizeJoinCode } from "../lib/joinCode";
import { createCloudCampaign, stopSync } from "../lib/sync/engine";

/** Single-screen campaign creation with cloud upload. */
export function CreateCampaignScreen() {
  const nav = useNavigate();
  const username = useAuth((s) => s.username);
  const startCampaign = useCampaign((s) => s.startCampaign);
  const resetCampaign = useCampaign((s) => s.resetCampaign);

  const [campaignName, setCampaignName] = useState("");
  const [hunterName, setHunterName] = useState(username ?? "");
  const [chosenJoinCode, setChosenJoinCode] = useState("");
  const [randomPalico, setRandomPalico] = useState(false);
  const [weaponType, setWeaponType] = useState<WeaponType | null>(null);
  const [potions, setPotions] = useState(1);
  const [maxDay, setMaxDay] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdJoinCode, setCreatedJoinCode] = useState<string | null>(null);

  const joinCodeValid = isValidJoinCode(chosenJoinCode);

  const finish = async () => {
    if (
      !weaponType ||
      !isWeaponImplemented(weaponType) ||
      !campaignName.trim() ||
      !joinCodeValid
    ) {
      return;
    }
    if (!navigator.onLine) {
      setError("Internet connection required.");
      return;
    }
    setBusy(true);
    setError(null);

    await stopSync();
    resetCampaign();

    startCampaign({
      campaignName: campaignName.trim(),
      name: hunterName.trim() || username || "Hunter",
      palicoName: randomPalico ? randomPalicoName() : undefined,
      weaponType,
      potions,
      maxDay: Math.max(1, maxDay),
    });

    const result = await createCloudCampaign(chosenJoinCode.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreatedJoinCode(result.code);
  };

  if (createdJoinCode) {
    return (
      <Screen title="Campaign created" back={false}>
        <div className="paper-card p-6 text-center">
          <p className="text-sm text-ink-soft">Share this join code:</p>
          <p className="mt-2 font-display text-3xl tracking-widest">
            {createdJoinCode}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(createdJoinCode);
            }}
            className="mt-4 text-sm text-accent underline"
          >
            Copy code
          </button>
          <Button
            rounded="lg"
            onClick={() => nav("/", { replace: true })}
            className="mt-6 w-full py-2.5 font-semibold"
          >
            To Camp
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="New Campaign" subtitle="Setup">
      <div className="flex flex-col gap-4">
        <Field
          label="Campaign name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />

        <Field
          label="Hunter name"
          value={hunterName}
          onChange={(e) => setHunterName(e.target.value)}
        />

        <Field
          label="Join code"
          value={chosenJoinCode}
          onChange={(e) => setChosenJoinCode(normalizeJoinCode(e.target.value))}
          placeholder="e.g. A1B2C3D4"
          maxLength={8}
          className="font-display tracking-widest uppercase"
          hint="8 characters (letters & numbers) — entered by others to join."
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={randomPalico}
            onChange={(e) => setRandomPalico(e.target.checked)}
            className="h-4 w-4"
          />
          Random Palico
        </label>

        <WeaponPicker value={weaponType} onChange={setWeaponType} />

        <Row label="Group Potions">
          <Stepper value={potions} onChange={setPotions} min={0} max={3} />
        </Row>

        <Row label="Days">
          <Stepper value={maxDay} onChange={setMaxDay} min={0} max={60} />
        </Row>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          rounded="lg"
          disabled={
            busy ||
            !campaignName.trim() ||
            !joinCodeValid ||
            !weaponType ||
            !isWeaponImplemented(weaponType) ||
            !hunterName.trim()
          }
          onClick={() => void finish()}
          className="py-3 font-semibold"
        >
          {busy ? "Creating…" : "Off to the hunt!"}
        </Button>
      </div>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="paper-card flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
