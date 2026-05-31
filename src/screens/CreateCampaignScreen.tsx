import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { Screen } from "../ui/Screen";
import { Stepper } from "../ui/Stepper";
import { WeaponPicker } from "../ui/WeaponPicker";
import { useAuth } from "../store/auth";
import { useCampaign } from "../store/campaign";
import { isWeaponImplemented } from "../data/weapons";
import { randomPalicoName } from "../data/palicoNames";
import { isValidJoinCode, normalizeJoinCode } from "../lib/joinCode";
import { createCloudCampaign } from "../lib/sync/engine";

/** Single-screen campaign creation with cloud upload. */
export function CreateCampaignScreen() {
  const nav = useNavigate();
  const username = useAuth((s) => s.username);
  const startCampaign = useCampaign((s) => s.startCampaign);

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
      setError("Internetverbindung erforderlich.");
      return;
    }
    setBusy(true);
    setError(null);

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
      <Screen title="Kampagne erstellt" back={false}>
        <div className="paper-card p-6 text-center">
          <p className="text-sm text-ink-soft">Teile diesen Join-Code:</p>
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
            Code kopieren
          </button>
          <button
            type="button"
            onClick={() => nav("/", { replace: true })}
            className="mt-6 w-full rounded-lg border-[1.5px] border-line-strong bg-accent py-2.5 font-semibold text-white active:translate-y-px"
          >
            Ins Camp
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Neue Kampagne" subtitle="Setup">
      <div className="flex flex-col gap-4">
        <Field label="Kampagnenname" value={campaignName} onChange={setCampaignName} />

        <Field
          label="Jägername"
          value={hunterName}
          onChange={setHunterName}
        />

        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-ink-soft">
            Join-Code
          </span>
          <input
            value={chosenJoinCode}
            onChange={(e) => setChosenJoinCode(normalizeJoinCode(e.target.value))}
            placeholder="z. B. A1B2C3D4"
            maxLength={8}
            className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 font-display tracking-widest uppercase outline-none"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            8 Zeichen (Buchstaben & Zahlen) — wird von anderen zum Beitreten
            eingegeben.
          </span>
        </label>

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
          <Stepper value={potions} onChange={setPotions} min={0} max={99} />
        </Row>

        <Row label="Tage">
          <Stepper value={maxDay} onChange={setMaxDay} min={0} max={60} />
        </Row>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={
            busy ||
            !campaignName.trim() ||
            !joinCodeValid ||
            !weaponType ||
            !isWeaponImplemented(weaponType) ||
            !hunterName.trim()
          }
          onClick={() => void finish()}
          className="rounded-lg border-[1.5px] border-line-strong bg-accent py-3 font-semibold text-white active:translate-y-px disabled:opacity-40"
        >
          {busy ? "Wird erstellt…" : "Auf in die Jagd"}
        </button>
      </div>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="text-xs uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
      />
    </label>
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
