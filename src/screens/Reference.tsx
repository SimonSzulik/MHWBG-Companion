import { Screen } from "../ui/Screen";
import { wildspireWaste } from "../data/wildspireWaste";

/** Reference drill-in: monsters + a quick status-effect glossary. */
export function Reference() {
  return (
    <Screen title="Referenz" subtitle="Regeln & Monster">
      <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
        Monster
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {wildspireWaste.monsters.map((m) => (
          <div key={m.id} className="paper-card px-4 py-3">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-ink-soft">{m.kind}</p>
          </div>
        ))}
      </div>

      <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
        Statuseffekte
      </p>
      <div className="flex flex-col gap-2">
        {STATUS.map((s) => (
          <div key={s.name} className="paper-card px-4 py-3">
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-ink-soft">{s.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-dashed border-line-strong/40 px-3 py-2 text-center text-xs text-ink-soft">
        Platzhalter-Texte — werden aus den Regelheften ergänzt.
      </p>
    </Screen>
  );
}

const STATUS = [
  { name: "Gift", text: "Verliert über Zeit Lebenspunkte." },
  { name: "Betäubung", text: "Kann eine Aktion nicht ausführen." },
  { name: "Schlaf", text: "Inaktiv bis Schaden genommen wird; nächster Treffer stark." },
  { name: "Schwäche", text: "Bruchstelle freigelegt — höherer Schaden möglich." },
];
