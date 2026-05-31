import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeaponType } from "../domain/types";
import { useCampaign } from "../store/campaign";

const WEAPONS: { type: WeaponType; tag: string }[] = [
  { type: "Switch Axe", tag: "axe ⇄ sword modes" },
  { type: "Charge Blade", tag: "defensive charge" },
  { type: "Insect Glaive", tag: "kinsect mobility" },
  { type: "Heavy Bowgun", tag: "ranged barrage" },
];

/** 3-step hunter creation flow, mirroring the mockups. */
export function Onboarding() {
  const nav = useNavigate();
  const startCampaign = useCampaign((s) => s.startCampaign);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [palicoName, setPalicoName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [weaponType, setWeaponType] = useState<WeaponType | null>(null);

  const finish = () => {
    if (!weaponType) return;
    startCampaign({ name, palicoName, playerName, weaponType });
    nav("/", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-8">
      {step === 0 && (
        <Welcome onStart={() => setStep(1)} />
      )}

      {step === 1 && (
        <Stepframe
          title="Create your Hunter"
          sub="Schritt 1 von 3 — Identität"
          cta="Weiter → Waffe wählen"
          onCta={() => setStep(2)}
          ctaDisabled={!name.trim()}
        >
          <Field label="Hunter Name" value={name} onChange={setName} autoFocus />
          <Field label="Palico Name" value={palicoName} onChange={setPalicoName} />
          <Field label="Spieler Name" value={playerName} onChange={setPlayerName} />
        </Stepframe>
      )}

      {step === 2 && (
        <Stepframe
          title="Choose your Weapon"
          sub="Schritt 2 von 3 — legt deinen Forge-Baum fest"
          cta={weaponType ? `${weaponType} bestätigen` : "Waffe wählen"}
          onCta={() => setStep(3)}
          ctaDisabled={!weaponType}
        >
          <div className="grid grid-cols-2 gap-3">
            {WEAPONS.map((w) => (
              <button
                key={w.type}
                type="button"
                onClick={() => setWeaponType(w.type)}
                className={`paper-card flex flex-col items-center gap-2 p-4 text-center active:translate-y-px ${
                  weaponType === w.type ? "ring-2 ring-accent bg-accent-faint" : ""
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl border-[1.5px] border-line-strong bg-paper-2 text-xl">
                  ⚔
                </span>
                <span className="font-semibold leading-tight">{w.type}</span>
                <span className="text-xs text-ink-soft">{w.tag}</span>
              </button>
            ))}
          </div>
        </Stepframe>
      )}

      {step === 3 && weaponType && (
        <Stepframe
          title="You're ready"
          sub="Schritt 3 von 3 — Überblick"
          cta="Ins Camp →"
          onCta={finish}
        >
          <div className="paper-card flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2">
              🧍
            </span>
            <div>
              <p className="font-semibold">{name || "Hunter"}</p>
              <p className="text-sm text-ink-soft">
                {weaponType}
                {palicoName ? ` · Palico ${palicoName}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-1 text-sm uppercase tracking-wide text-accent">
            Start-Kit
          </p>
          <ul className="paper-card divide-y divide-line p-0 text-sm">
            <li className="px-4 py-3">Proto Commission (Starterwaffe)</li>
            <li className="px-4 py-3">3 × Potion</li>
          </ul>
          <p className="rounded-lg border border-dashed border-accent/70 bg-accent-faint/50 px-3 py-2 text-xs text-ink-soft">
            Die Forge zeigt jetzt nur den {weaponType}-Baum.
          </p>
        </Stepframe>
      )}
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const nav = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <span className="grid h-24 w-24 place-items-center rounded-2xl border-[1.5px] border-line-strong bg-paper-2 text-4xl">
        🗡
      </span>
      <div>
        <h1 className="font-display text-3xl">Willkommen, Hunter</h1>
        <p className="mt-1 text-ink-soft">Fünfte Flotte · Wildspire Waste</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl border-[1.5px] border-line-strong bg-accent px-5 py-3 font-semibold text-white active:translate-y-px"
        >
          Neue Kampagne starten
        </button>
        <button
          type="button"
          onClick={() => nav("/")}
          className="rounded-xl border-[1.5px] border-line-strong bg-card px-5 py-3 font-semibold active:translate-y-px"
        >
          Bestehende öffnen
        </button>
      </div>
      <p className="text-xs text-ink-soft">Daten bleiben auf diesem Gerät.</p>
    </div>
  );
}

function Stepframe({
  title,
  sub,
  cta,
  onCta,
  ctaDisabled,
  children,
}: {
  title: string;
  sub: string;
  cta: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{sub}</p>
      <div className="mt-5 flex flex-col gap-3">{children}</div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onCta}
        disabled={ctaDisabled}
        className="mt-6 rounded-xl border-[1.5px] border-line-strong bg-accent px-5 py-3 font-semibold text-white active:translate-y-px disabled:opacity-40"
      >
        {cta}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="paper-card block px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-lg outline-none placeholder:text-line"
        placeholder="…"
      />
    </label>
  );
}
