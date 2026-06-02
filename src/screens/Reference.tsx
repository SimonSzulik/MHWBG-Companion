import { useMemo, useState } from "react";
import { Screen } from "../ui/Screen";
import { gameData } from "../data/gameData";
import { iconUrl } from "../domain/icons";

type GuideEntry = {
  name: string;
  text: string;
  icon?: string;
};

type GuideSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  entries: GuideEntry[];
};

/** Quick guide based on the player reference sheet (without downtime section). */
export function Reference() {
  const [openSection, setOpenSection] = useState<string>("hunters-turn");
  const [skillsQuery, setSkillsQuery] = useState("");

  const armorSkills = useMemo(
    () =>
      ARMOR_SKILLS.filter((skill) => {
        const query = skillsQuery.trim().toLowerCase();
        if (!query) return true;
        return `${skill.name} ${skill.text}`.toLowerCase().includes(query);
      }),
    [skillsQuery],
  );

  const sections: GuideSection[] = [
    {
      id: "hunters-turn",
      title: "Hunters Turn",
      subtitle: "Ablauf und Aktionen",
      icon: "ref-time.svg",
      entries: HUNTERS_TURN,
    },
    {
      id: "attack-symbols",
      title: "Attack Card Symbols",
      subtitle: "Schnelles Nachschlagen",
      icon: "ref-attack.svg",
      entries: ATTACK_SYMBOLS,
    },
    {
      id: "terrain",
      title: "Terrain Nodes",
      subtitle: "Busch, Fels, Teich",
      icon: "ref-rock.svg",
      entries: TERRAIN,
    },
    {
      id: "monster-ailments",
      title: "Monster Status Ailments",
      subtitle: "Effekte auf Monster",
      icon: "ref-status.svg",
      entries: MONSTER_AILMENTS,
    },
    {
      id: "hunter-ailments",
      title: "Hunter Status Ailments",
      subtitle: "Effekte auf Jäger",
      icon: "ref-status.svg",
      entries: HUNTER_AILMENTS,
    },
    {
      id: "armor-skills",
      title: "Armor Skills",
      subtitle: "Komplette Referenz",
      icon: "green-mail",
      entries: armorSkills,
    },
  ];

  return (
    <Screen title="Quick Guide" subtitle={gameData.box}>
      <div className="mb-3 paper-card p-4">
        <div className="mb-2 flex items-center gap-3">
          <IconBubble icon="ref-quick-guide.svg" />
          <div>
            <p className="font-semibold">Nachschlagewerk</p>
            <p className="text-xs text-ink-soft">
              Alles Wichtige direkt am Tisch. Downtime bewusst ausgeklammert.
            </p>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const isOpen = openSection === section.id;
        return (
          <div key={section.id} className="mb-3 paper-card">
            <button
              type="button"
              onClick={() => setOpenSection((prev) => (prev === section.id ? "" : section.id))}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:translate-y-px"
            >
              <IconBubble icon={section.icon} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{section.title}</p>
                <p className="text-xs text-ink-soft">{section.subtitle}</p>
              </div>
              <span className={`text-lg text-ink-soft transition-transform ${isOpen ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-line px-3 pb-3 pt-2">
                {section.id === "armor-skills" && (
                  <div className="mb-3">
                    <input
                      type="search"
                      value={skillsQuery}
                      onChange={(e) => setSkillsQuery(e.target.value)}
                      placeholder="Skills filtern (z. B. poison, evade, guard)"
                      className="w-full rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <ul className="flex flex-col gap-2">
                  {section.entries.map((entry) => (
                    <li key={entry.name} className="rounded-lg border border-line bg-card px-3 py-2">
                      <div className="mb-1 flex items-start gap-2">
                        <IconBubble icon={entry.icon} compact />
                        <p className="font-medium">{entry.name}</p>
                      </div>
                      <p className="text-xs text-ink-soft">{entry.text}</p>
                    </li>
                  ))}
                  {section.entries.length === 0 && section.id === "armor-skills" && (
                    <li className="rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink-soft">
                      Keine Treffer fuer "{skillsQuery}".
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </Screen>
  );
}

function IconBubble({ icon, compact }: { icon?: string; compact?: boolean }) {
  const sizeClass = compact ? "h-7 w-7" : "h-9 w-9";
  if (!icon) {
    return (
      <span
        className={`grid ${sizeClass} shrink-0 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2 text-base`}
      >
        •
      </span>
    );
  }
  return (
    <span
      className={`grid ${sizeClass} shrink-0 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2`}
    >
      <img src={iconUrl(icon)} alt="" className={compact ? "h-4 w-4 object-contain" : "h-5 w-5 object-contain"} />
    </span>
  );
}

const HUNTERS_TURN: GuideEntry[] = [
  { name: "1) Turn waehlen", text: "Waehle Combat oder Preparation Turn. Das bestimmt deine erlaubten Aktionen.", icon: "ref-time.svg" },
  { name: "2) Attack Card spielen (Combat)", text: "Lege eine Angriffskarte auf dein Stamina-Board. Das Monster-Verhalten begrenzt die Anzahl.", icon: "ref-attack.svg" },
  { name: "3) Walk", text: "Bewege 1 Feld. Nur einmal pro Zug.", icon: "ref-walk.svg" },
  { name: "4) Sprint", text: "Lege eine Angriffskarte verdeckt und bewege bis zur Agility dieser Karte.", icon: "ref-sprint.svg" },
  { name: "5) Potion nutzen (Preparation)", text: "Verbrauche 1 Gruppen-Trank, heile voll und wirf alle Karten von deinem Board ab.", icon: "ref-potion.svg" },
  { name: "6) Sharpen (Preparation)", text: "Alle abgelegten Damage-Karten in das Damage-Deck zurueck und mischen.", icon: "ref-sharpen.svg" },
  { name: "7) Time Card", text: "Ziehe und resolve am Ende eine Time Card.", icon: "ref-time.svg" },
];

const ATTACK_SYMBOLS: GuideEntry[] = [
  { name: "Agility", text: "Wert fuer Sprint und Dodge.", icon: "ref-agility.svg" },
  { name: "Damage", text: "Ziehe so viele Damage-Karten.", icon: "ref-damage.svg" },
  { name: "Movement", text: "Bewege bis zu diesem Wert; ggf. Richtungsangabe vom Monster beachten.", icon: "ref-movement.svg" },
  { name: "Armor", text: "Reduziert physischen eingehenden Schaden.", icon: "ref-armor.svg" },
  { name: "Range", text: "Zum Spielen muss das Ziel in Reichweite sein.", icon: "ref-range.svg" },
  { name: "Break", text: "Fuege so viele Break-Token hinzu.", icon: "ref-break.svg" },
  { name: "Combo", text: "Du brauchst bereits diese Anzahl offener Angriffskarten.", icon: "ref-combo.svg" },
  { name: "Element/Status", text: "Wende das angegebene Element oder den Status an.", icon: "ref-element.svg" },
  { name: "Resistance", text: "Reduziert elementaren Schaden des angegebenen Typs.", icon: "ref-resistance.svg" },
  { name: "Normal Stamina", text: "Karte kommt auf die Stamina-Leiste und zaehlt fuer das Angriffslimit.", icon: "ref-stamina.svg" },
  { name: "Stamina End", text: "Wie Normal Stamina, beendet aber den Zug sofort.", icon: "ref-stamina-end.svg" },
];

const TERRAIN: GuideEntry[] = [
  { name: "Bush", text: "Ein Jäger auf einem Busch-Feld hat −4 Bedrohung.", icon: "ref-bush.svg" },
  { name: "Rock", text: "Ein Jäger auf einem Fels-Feld darf 1 Feld bewegen, ohne Angriffskarten auf dem Bedrohungs-Board zu platzieren.", icon: "ref-rock.svg" },
  { name: "Pond", text: "Betritt ein Jäger aus beliebigem Grund ein Teich-Feld, muss er 1 Karte vom Schadensstapel ziehen.", icon: "ref-pond.svg" },
];

const MONSTER_AILMENTS: GuideEntry[] = [
  { name: "Stun", text: "Das naechste Verhalten des Monsters hat Dodge-Wert 1.", icon: "yellow-head" },
  { name: "Poison", text: "Monster erleidet am Ende seines naechsten Zuges 2 Schaden.", icon: "ref-status.svg" },
  { name: "Sleep", text: "Nur Hunter-Turn- und Hunter-Attack-Symbol auf dem naechsten Verhalten aufloesen.", icon: "ref-status.svg" },
  { name: "Paralysis", text: "Hat das naechste Verhalten ein Movement-Symbol, ist dessen Wert 0.", icon: "ref-status.svg" },
  { name: "Blastblight", text: "Jeder Monster-Teil hat −1 Armor bis zum Ende des naechsten Monster-Zuges.", icon: "ref-status.svg" },
];

const HUNTER_AILMENTS: GuideEntry[] = [
  { name: "Stun", text: "Lege eine Karte verdeckt auf dein Stamina-Board (falls moeglich).", icon: "ref-status.svg" },
  { name: "Poison", text: "Du erleidest am Ende deines naechsten Zuges 2 Schaden.", icon: "ref-status.svg" },
  { name: "Sleep", text: "Keine Attack/Move/Dodge-Aktionen via Stamina-Board bis Ende deines naechsten Zuges.", icon: "ref-status.svg" },
  { name: "Paralysis", text: "Wirf auf 2 Handkarten ab.", icon: "ref-status.svg" },
  { name: "Blastblight", text: "Du hast −2 Armor bis zum Ende deines naechsten Zuges.", icon: "ref-status.svg" },
];

const ARMOR_SKILLS: GuideEntry[] = [
  { name: "Agitator", text: "Draw +1 damage against broken parts.", icon: "green-mail" },
  { name: "Aquatic Expert", text: "Gain immunity to pond nodes.", icon: "ref-pond.svg" },
  { name: "Azure Rathalos Mastery", text: "When resolving elemental damage, draw 3 and pick one.", icon: "azure-rathalos" },
  { name: "Black Diablos Mastery", text: "Same as Diablos Mastery.", icon: "yellow-head" },
  { name: "Botanist", text: "During gathering, when hunters gain a potion, everyone may recover to full health.", icon: "ref-potion.svg" },
  { name: "Critical Eye", text: "When you draw damage, draw +1, then place 1 on top of your damage deck before inflicting damage.", icon: "ref-range.svg" },
  { name: "Constitution", text: "Once per quest, discard attack cards when dodging.", icon: "ref-agility.svg" },
  { name: "Diablos Mastery", text: "Draw +1 damage card on non-elemental attacks.", icon: "ref-damage.svg" },
  { name: "Evade Extender", text: "Move +1 when dodging.", icon: "ref-sprint.svg" },
  { name: "Fire Attack", text: "Draw +1 damage card on fire attacks.", icon: "ref-element.svg" },
  { name: "Focus", text: "Reduce combo icons by 1 (minimum 1).", icon: "ref-combo.svg" },
  { name: "Heroics", text: "At 2 health or less, draw +1 damage on non-elemental attacks.", icon: "ref-damage.svg" },
  { name: "Guard", text: "Gain +1 armor when playing attacks that grant armor.", icon: "ref-armor.svg" },
  { name: "Handicraft", text: "Once per quest, reshuffle your empty damage deck during an attack.", icon: "ref-sharpen.svg" },
  { name: "Ice Attack", text: "Draw +1 damage card on ice attacks.", icon: "ref-element.svg" },
  { name: "Intimidator", text: "You cannot suffer damage during the gathering phase.", icon: "ref-resistance.svg" },
  { name: "Kushala Daora Flight", text: "Gain +1 agility when dodging or sprinting.", icon: "ref-agility.svg" },
  { name: "Latent Power", text: "Draw +1 damage on your first attack if you suffered damage last monster turn.", icon: "ref-damage.svg" },
  { name: "Marathon Runner", text: "Move 2 instead of 1 when walking.", icon: "ref-walk.svg" },
  { name: "Maximum Might", text: "Draw +2 damage, but return 2 to the deck.", icon: "ref-damage.svg" },
  { name: "Nergigante Hunger", text: "If you inflict damage during your turn, recover 1 health.", icon: "ref-potion.svg" },
  { name: "Palico Rally", text: "You may use your Palico ability twice per quest.", icon: "green-head" },
  { name: "Part Breaker", text: "Cards with break gain +1 break.", icon: "ref-break.svg" },
  { name: "Poison Resistance", text: "You are immune to poison.", icon: "ref-status.svg" },
  { name: "Rathalos Mastery", text: "When applying fire, draw elemental damage card instead of placing a fire token.", icon: "rathalos" },
  { name: "Resentment", text: "If you recovered health during previous turn, first attack this turn gains +2 damage.", icon: "ref-damage.svg" },
  { name: "Sleep Resistance", text: "You are immune to sleep.", icon: "ref-status.svg" },
  { name: "Slugger", text: "Once per quest, apply +1 stun token.", icon: "ref-status.svg" },
  { name: "Speed Eating", text: "Once per quest, use combat actions and preparation actions in the same turn.", icon: "ref-time.svg" },
  { name: "Sporepuff Expert", text: "When recovering health from non-potion sources, recover +1 additional health.", icon: "ref-potion.svg" },
  { name: "Stun Resistance", text: "You are immune to stun.", icon: "ref-status.svg" },
  { name: "Teostra Technique", text: "Once per quest, shuffle damage cards from an attack back into the damage deck.", icon: "ref-sharpen.svg" },
  { name: "Thunder Attack", text: "Draw +1 damage card on thunder attacks.", icon: "ref-element.svg" },
  { name: "Water Attack", text: "Draw +1 damage card on water attacks.", icon: "ref-element.svg" },
  { name: "Weakness Exploit", text: "Attack cards with 2+ combo draw +1 damage.", icon: "ref-combo.svg" },
  { name: "Weakness Exploit (Rathalos Mail)", text: "Once per quest, swap your hunter token with another player while keeping facing.", icon: "rathalos" },
];
