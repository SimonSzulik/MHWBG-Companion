import { Screen } from "../ui/Screen";
import { gameData } from "../data/gameData";

/** Reference drill-in: monsters, terrain nodes, and status-ailment glossary. */
export function Reference() {
  return (
    <Screen title="Referenz" subtitle={gameData.box}>
      <SectionTitle>Monster</SectionTitle>
      <div className="mb-5 flex flex-col gap-2">
        {gameData.monsters.map((m) => (
          <div key={m.id} className="paper-card px-4 py-3">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-ink-soft">
              {m.kind}
              {m.notes ? ` · ${m.notes}` : ""}
            </p>
          </div>
        ))}
      </div>

      <SectionTitle>Geländefelder</SectionTitle>
      <div className="mb-5 flex flex-col gap-2">
        {TERRAIN.map((t) => (
          <Entry key={t.name} name={t.name} text={t.text} />
        ))}
      </div>

      <SectionTitle>Monster-Statuseffekte</SectionTitle>
      <div className="mb-5 flex flex-col gap-2">
        {MONSTER_AILMENTS.map((s) => (
          <Entry key={s.name} name={s.name} text={s.text} />
        ))}
      </div>

      <SectionTitle>Jäger-Statuseffekte</SectionTitle>
      <div className="flex flex-col gap-2">
        {HUNTER_AILMENTS.map((s) => (
          <Entry key={s.name} name={s.name} text={s.text} />
        ))}
      </div>
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
      {children}
    </p>
  );
}

function Entry({ name, text }: { name: string; text: string }) {
  return (
    <div className="paper-card px-4 py-3">
      <p className="font-medium">{name}</p>
      <p className="text-xs text-ink-soft">{text}</p>
    </div>
  );
}

// Verified against the Ancient Forest / shared player reference.
const TERRAIN = [
  { name: "Busch (Bush)", text: "Ein Jäger auf einem Busch-Feld hat −4 Bedrohung." },
  { name: "Fels (Rock)", text: "Ein Jäger auf einem Fels-Feld darf 1 Feld bewegen, ohne Angriffskarten auf seinem Bedrohungs-Board zu platzieren." },
  { name: "Teich (Pond)", text: "Betritt ein Jäger aus beliebigem Grund ein Teich-Feld, muss er 1 Karte von seinem Schadensstapel ziehen." },
];

const MONSTER_AILMENTS = [
  { name: "Betäubung (Stun)", text: "Das nächste Verhalten des Monsters hat einen Ausweichwert von 1." },
  { name: "Gift (Poison)", text: "Das Monster erleidet am Ende seines Zuges 2 Schaden." },
  { name: "Schlaf (Sleep)", text: "Nur das Hunter-Turn-Symbol und Hunter-Attack-Symbol auf dem nächsten Verhalten des Monsters werden aufgelöst." },
  { name: "Lähmung (Paralysis)", text: "Liegt ein Bewegungssymbol auf dem nächsten Verhalten des Monsters, hat es den Wert 0." },
  { name: "Gleißlicht (Blastlight)", text: "Jeder Teil des Monsters hat −1 Rüstung bis zum Ende seines nächsten Zuges." },
];

const HUNTER_AILMENTS = [
  { name: "Betäubung (Stun)", text: "Der Jäger muss eine Karte verdeckt auf sein Stamina-Board legen (falls möglich)." },
  { name: "Gift (Poison)", text: "Der Jäger erleidet am Ende seines nächsten Zuges 2 Schaden." },
  { name: "Schlaf (Sleep)", text: "Der Jäger kann keine Angriffskarten auf sein Stamina-Board legen, bewegen oder ausweichen bis zum Ende seines nächsten Zuges." },
  { name: "Lähmung (Paralysis)", text: "Der Jäger muss bis auf 2 Karten abwerfen." },
  { name: "Gleißlicht (Blastlight)", text: "Der Jäger hat −2 Rüstung bis zum Ende seines nächsten Zuges." },
];
