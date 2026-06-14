import { useMemo, useState } from "react";
import { Screen } from "../ui/Screen";
import { gameData } from "../data/gameData";
import { armorSets } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearDef } from "../domain/types";

/**
 * Info tab — a searchable hunter's handbook.
 *
 * Goes beyond the printed player reference: alongside the turn flow, symbols,
 * terrain and ailments it adds a keyword glossary and a live armour browser
 * (sets, defence and granted abilities) generated from the catalog. Downtime is
 * intentionally omitted — it has its own menu.
 */

type Category =
  | "all"
  | "turn"
  | "symbols"
  | "terrain"
  | "ailments"
  | "keywords"
  | "skills"
  | "armor";

type Entry = { group: string; name: string; text: string; icon?: string };

type Group = {
  id: string;
  label: string;
  category: Exclude<Category, "all">;
  icon?: string;
};

const CHIPS: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "turn", label: "Turn" },
  { id: "symbols", label: "Symbols" },
  { id: "terrain", label: "Terrain" },
  { id: "ailments", label: "Ailments" },
  { id: "keywords", label: "Keywords" },
  { id: "skills", label: "Skills" },
  { id: "armor", label: "Armor" },
];

export function Reference() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const { groups, entries } = useMemo(buildHandbook, []);

  const q = query.trim().toLowerCase();
  const matches = (e: Entry, g: Group) =>
    !q ||
    `${e.name} ${e.text} ${g.label}`.toLowerCase().includes(q);

  const visibleGroups = groups
    .map((group) => ({
      group,
      items: entries.filter(
        (e) =>
          e.group === group.id &&
          (category === "all" || group.category === category) &&
          matches(e, group),
      ),
    }))
    .filter((g) => g.items.length > 0);

  const totalShown = visibleGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Screen title="Hunter's Handbook" subtitle={gameData.box} hideHeader>
      <div className="sticky top-0 z-10 -mx-4 -mt-[calc(env(safe-area-inset-top)+0.75rem)] mb-3 bg-paper/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="mb-2">
          <h1 className="font-display text-2xl leading-tight">Hunter's Handbook</h1>
          <p className="text-sm text-ink-soft">{gameData.box}</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rules, keywords, skills, armor…"
          className="w-full rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {CHIPS.map((chip) => {
            const active = category === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategory(chip.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold active:translate-y-px ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-line-strong bg-card text-ink-soft"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {totalShown === 0 ? (
        <div className="paper-card p-5 text-center text-sm text-ink-soft">
          No entries match {q ? `“${query}”` : "this filter"}.
        </div>
      ) : (
        visibleGroups.map(({ group, items }) => (
          <section key={group.id} className="mb-4">
            <div className="mb-2 flex items-center gap-2 px-1">
              <IconBubble icon={group.icon} compact />
              <h2 className="font-display text-lg leading-none">{group.label}</h2>
              <span className="ml-auto text-xs text-ink-soft">{items.length}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {items.map((entry) => (
                <li
                  key={`${group.id}-${entry.name}`}
                  className="paper-card flex items-start gap-3 px-3 py-2.5"
                >
                  <IconBubble icon={entry.icon} />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{entry.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-soft">
                      {entry.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Screen>
  );
}

function IconBubble({ icon, compact }: { icon?: string; compact?: boolean }) {
  const size = compact ? "h-7 w-7" : "h-9 w-9";
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2`}
    >
      {icon ? (
        <img
          src={iconUrl(icon)}
          alt=""
          className={compact ? "h-4 w-4 object-contain" : "h-5 w-5 object-contain"}
        />
      ) : (
        <span className="text-sm text-ink-soft">•</span>
      )}
    </span>
  );
}

/** Assemble the static guide groups + the catalog-driven armour groups. */
function buildHandbook(): { groups: Group[]; entries: Entry[] } {
  const groups: Group[] = [...STATIC_GROUPS];
  const entries: Entry[] = [...STATIC_ENTRIES];

  // Armour sets, pieces, defence and abilities — straight from the catalog so
  // it always matches what the forge actually offers.
  for (const set of armorSets()) {
    const groupId = `set-${set.id}`;
    groups.push({
      id: groupId,
      label: `${set.label} Set`,
      category: "armor",
      icon: set.icon,
    });
    for (const id of set.gearIds) {
      const piece = gameData.gear.find((g) => g.id === id);
      if (!piece) continue;
      entries.push({
        group: groupId,
        name: piece.name,
        text: armorPieceText(piece),
        icon: piece.tierIcon ?? set.icon,
      });
    }
  }

  // Starter armour (granted on campaign start, not forgeable).
  const starters = gameData.gear.filter((g) => g.isStarter);
  if (starters.length > 0) {
    groups.push({
      id: "starter-armor",
      label: "Starter Armor",
      category: "armor",
      icon: "white-mail",
    });
    for (const piece of starters) {
      entries.push({
        group: "starter-armor",
        name: piece.name,
        text: armorPieceText(piece),
        icon: piece.tierIcon ?? "white-mail",
      });
    }
  }

  return { groups, entries };
}

function armorPieceText(piece: GearDef): string {
  const slot =
    piece.slot === "head"
      ? "Helm"
      : piece.slot === "chest"
        ? "Mail"
        : piece.slot === "legs"
          ? "Greaves"
          : piece.slot;
  const parts = [`${slot} · Defense +${piece.defense ?? 0}`];
  if (piece.effect) parts.push(`Ability: ${piece.effect}`);
  return parts.join(" — ");
}

const STATIC_GROUPS: Group[] = [
  { id: "turn", label: "Hunter's Turn", category: "turn", icon: "ref-time.svg" },
  { id: "symbols", label: "Attack Card Symbols", category: "symbols", icon: "ref-attack.svg" },
  { id: "terrain", label: "Terrain Nodes", category: "terrain", icon: "ref-rock.svg" },
  { id: "monster-ailments", label: "Monster Status Ailments", category: "ailments", icon: "ref-status.svg" },
  { id: "hunter-ailments", label: "Hunter Status Ailments", category: "ailments", icon: "ref-status.svg" },
  { id: "glossary", label: "Glossary & Keywords", category: "keywords", icon: "ref-quick-guide.svg" },
  { id: "skills", label: "Armor Skills", category: "skills", icon: "green-mail" },
];

const STATIC_ENTRIES: Entry[] = [
  // --- Hunter's Turn ---
  { group: "turn", name: "1. Choose a turn type", text: "Pick a Combat or Preparation turn — this decides which actions you may take.", icon: "ref-time.svg" },
  { group: "turn", name: "Play an Attack Card (Combat)", text: "Place an attack card on your stamina board. The monster's behavior limits how many you may play.", icon: "ref-attack.svg" },
  { group: "turn", name: "Walk", text: "Move 1 space. Only once per turn.", icon: "ref-walk.svg" },
  { group: "turn", name: "Sprint", text: "Place an attack card face down on your stamina board, then move up to its Agility.", icon: "ref-sprint.svg" },
  { group: "turn", name: "Use a Potion (Preparation)", text: "Spend 1 of the group's potions to restore all your HP and discard every card from your board.", icon: "ref-potion.svg" },
  { group: "turn", name: "Sharpen (Preparation)", text: "Return all discarded damage cards to your damage deck and shuffle it.", icon: "ref-sharpen.svg" },
  { group: "turn", name: "End of turn — Time Card", text: "Draw and resolve a Time Card at the end of your turn.", icon: "ref-time.svg" },

  // --- Attack Card Symbols ---
  { group: "symbols", name: "Agility", text: "Used when sprinting or dodging.", icon: "ref-agility.svg" },
  { group: "symbols", name: "Damage", text: "Draw this many damage cards.", icon: "ref-damage.svg" },
  { group: "symbols", name: "Movement", text: "Move up to this far. The icon may force a direction relative to the monster; otherwise you choose.", icon: "ref-movement.svg" },
  { group: "symbols", name: "Armor", text: "Reduce incoming physical damage by this value.", icon: "ref-armor.svg" },
  { group: "symbols", name: "Range", text: "You must be within this range to play the attack.", icon: "ref-range.svg" },
  { group: "symbols", name: "Break", text: "Apply this many break tokens to the targeted part.", icon: "ref-break.svg" },
  { group: "symbols", name: "Combo", text: "You must already have this many face-up attack cards on your stamina board to play the card.", icon: "ref-combo.svg" },
  { group: "symbols", name: "Element / Status", text: "Apply the specified element or status ailment.", icon: "ref-element.svg" },
  { group: "symbols", name: "Resistance", text: "Reduce incoming elemental damage of the specified type by this value.", icon: "ref-resistance.svg" },
  { group: "symbols", name: "Normal Stamina", text: "The card goes on your stamina bar and counts toward your attacks played this turn.", icon: "ref-stamina.svg" },
  { group: "symbols", name: "Stamina End", text: "Like Normal Stamina, but immediately ends your turn when played.", icon: "ref-stamina-end.svg" },

  // --- Terrain ---
  { group: "terrain", name: "Bush", text: "A hunter on a bush node has −4 threat.", icon: "ref-bush.svg" },
  { group: "terrain", name: "Rock", text: "A hunter on a rock node may move 1 node without placing attack cards on their stamina board.", icon: "ref-rock.svg" },
  { group: "terrain", name: "Pond", text: "When a hunter enters a pond node for any reason, they discard 1 card from their damage deck.", icon: "ref-pond.svg" },

  // --- Monster ailments ---
  { group: "monster-ailments", name: "Stun", text: "The monster's next behavior has a dodge value of 1.", icon: "ref-status.svg" },
  { group: "monster-ailments", name: "Poison", text: "The monster suffers 2 damage at the end of its next turn.", icon: "ref-status.svg" },
  { group: "monster-ailments", name: "Sleep", text: "Only resolve the Hunter Turn Symbol and Hunter Attack Symbol on the monster's next behavior.", icon: "ref-status.svg" },
  { group: "monster-ailments", name: "Paralysis", text: "If the monster's next behavior has a movement symbol, its value is 0.", icon: "ref-status.svg" },
  { group: "monster-ailments", name: "Blastblight", text: "Each part of the monster has −1 armor until the end of its next turn.", icon: "ref-status.svg" },

  // --- Hunter ailments ---
  { group: "hunter-ailments", name: "Stun", text: "Place a card face down on your stamina board if possible.", icon: "ref-status.svg" },
  { group: "hunter-ailments", name: "Poison", text: "You suffer 2 damage at the end of your next turn.", icon: "ref-status.svg" },
  { group: "hunter-ailments", name: "Sleep", text: "You can't place attack cards to attack, move, or dodge until the end of your next turn.", icon: "ref-status.svg" },
  { group: "hunter-ailments", name: "Paralysis", text: "Discard down to 2 cards.", icon: "ref-status.svg" },
  { group: "hunter-ailments", name: "Blastblight", text: "You have −2 armor until the end of your next turn.", icon: "ref-status.svg" },

  // --- Glossary / keywords (not spelled out on the reference sheet) ---
  { group: "glossary", name: "Threat", text: "How strongly the monster is drawn to a hunter. Face-up attack cards on your stamina board raise your threat; the monster usually targets the highest. Bushes lower it.", icon: "ref-attack.svg" },
  { group: "glossary", name: "Stamina Board", text: "Where you stack attack cards during your turn. Cards stay until you use a potion (or are forced to discard). A full board limits further attacks.", icon: "ref-stamina.svg" },
  { group: "glossary", name: "Behavior", text: "The monster's action for the turn. Resolve its symbols in order — movement, attacks, status — against the targeted hunter(s).", icon: "ref-attack.svg" },
  { group: "glossary", name: "Dodge", text: "When a monster attack would hit you, spend an attack card's Agility to move away and avoid or reduce it.", icon: "ref-agility.svg" },
  { group: "glossary", name: "Break & Broken Parts", text: "Break tokens build up on a monster part. Once a part breaks it takes more damage and drops extra crafting materials.", icon: "ref-break.svg" },
  { group: "glossary", name: "Damage Deck", text: "Your personal deck of damage cards. Attacks draw from it; Sharpen shuffles your discards back in. Running it empty mid-attack matters.", icon: "ref-damage.svg" },
  { group: "glossary", name: "Time Card", text: "Drawn at the end of each hunter turn. It advances the hunt and triggers the monster — running out of time fails the quest.", icon: "ref-time.svg" },
  { group: "glossary", name: "Combat vs Preparation", text: "A Combat turn lets you play attack cards; a Preparation turn lets you drink a potion or sharpen. You choose one each turn.", icon: "ref-time.svg" },
  { group: "glossary", name: "Armor (value)", text: "Reduces incoming physical damage. Comes from armor pieces and from attack cards that grant armor.", icon: "ref-armor.svg" },
  { group: "glossary", name: "Resistance", text: "Reduces incoming elemental damage of a matching type (fire, water, thunder, ice, dragon). The Meowscular Chef can grant +1 for a quest.", icon: "ref-resistance.svg" },
  { group: "glossary", name: "Set Bonus", text: "An ability marked “Set Bonus” only activates while you wear the required pieces of that armor set together.", icon: "green-mail" },
  { group: "glossary", name: "Potion", text: "A shared party resource. On a Preparation turn, spend one to fully heal and clear your stamina board.", icon: "ref-potion.svg" },
  { group: "glossary", name: "Gathering Phase", text: "Before the fight (investigation) the party gathers materials. Some skills, like Botanist, only trigger here.", icon: "ref-potion.svg" },
  { group: "glossary", name: "Assigned Quest (1★)", text: "Story hunts. Play each once — failures don't count. Clearing a monster's assigned hunt unlocks its investigations.", icon: "green-mail" },
  { group: "glossary", name: "Investigation Quest (2★–3★)", text: "Repeatable hunts (up to 4×). Both success and failure use an attempt and advance the campaign day.", icon: "green-mail" },
  { group: "glossary", name: "Tempered Quest (4★)", text: "The toughest hunts. Unlock once you've completed one of the monster's investigations.", icon: "ref-damage.svg" },

  // --- Armor skills ---
  { group: "skills", name: "Agitator", text: "Draw +1 damage against broken parts.", icon: "ref-break.svg" },
  { group: "skills", name: "Aquatic Expert", text: "Gain immunity to pond nodes.", icon: "ref-pond.svg" },
  { group: "skills", name: "Azure Rathalos Mastery", text: "When resolving elemental damage, draw 3 and pick one.", icon: "azure-rathalos" },
  { group: "skills", name: "Black Diablos Mastery", text: "Same as Diablos Mastery: draw +1 damage on non-elemental attacks.", icon: "ref-damage.svg" },
  { group: "skills", name: "Botanist", text: "During the gathering phase, when the hunters gain a potion, they may all immediately recover to full health.", icon: "ref-potion.svg" },
  { group: "skills", name: "Critical Eye", text: "When you draw damage, draw +1, then place 1 on top of your damage deck before inflicting damage.", icon: "ref-range.svg" },
  { group: "skills", name: "Constitution", text: "Once per quest, discard attack cards when dodging.", icon: "ref-agility.svg" },
  { group: "skills", name: "Diablos Mastery", text: "Draw +1 damage card on non-elemental attacks.", icon: "ref-damage.svg" },
  { group: "skills", name: "Evade Extender", text: "Move +1 when dodging.", icon: "ref-sprint.svg" },
  { group: "skills", name: "Fire Attack", text: "Draw +1 damage card on fire attacks.", icon: "ref-element.svg" },
  { group: "skills", name: "Focus", text: "Reduce combo icons by 1 (minimum 1).", icon: "ref-combo.svg" },
  { group: "skills", name: "Guard", text: "Gain +1 armor when playing attacks that grant armor.", icon: "ref-armor.svg" },
  { group: "skills", name: "Handicraft", text: "Once per quest, reshuffle your empty damage deck during an attack.", icon: "ref-sharpen.svg" },
  { group: "skills", name: "Heroics", text: "While at 2 health or less, draw +1 damage on non-elemental attacks.", icon: "ref-damage.svg" },
  { group: "skills", name: "Ice Attack", text: "Draw +1 damage card on ice attacks.", icon: "ref-element.svg" },
  { group: "skills", name: "Intimidator", text: "You can't suffer damage during the gathering phase.", icon: "ref-resistance.svg" },
  { group: "skills", name: "Kushala Daora Flight", text: "Gain +1 agility when dodging or sprinting.", icon: "ref-agility.svg" },
  { group: "skills", name: "Latent Power", text: "Draw +1 damage on your first attack if you suffered damage last monster turn.", icon: "ref-damage.svg" },
  { group: "skills", name: "Marathon Runner", text: "Move 2 instead of 1 when walking.", icon: "ref-walk.svg" },
  { group: "skills", name: "Maximum Might", text: "Draw +2 damage, but return 2 to the deck.", icon: "ref-damage.svg" },
  { group: "skills", name: "Nergigante Hunger", text: "If you inflict damage to the monster during your turn, recover 1 health.", icon: "ref-potion.svg" },
  { group: "skills", name: "Palico Rally", text: "You may use your Palico ability twice per quest.", icon: "green-head" },
  { group: "skills", name: "Part Breaker", text: "Cards with break gain +1 break.", icon: "ref-break.svg" },
  { group: "skills", name: "Poison Resistance", text: "You are immune to the poison status.", icon: "ref-status.svg" },
  { group: "skills", name: "Rathalos Mastery", text: "When applying fire, draw an elemental damage card instead of placing a fire token.", icon: "rathalos" },
  { group: "skills", name: "Resentment", text: "If you recovered health during your previous turn, the first attack you play this turn gains +2 damage.", icon: "ref-damage.svg" },
  { group: "skills", name: "Sleep Resistance", text: "You're immune to the sleep status.", icon: "ref-status.svg" },
  { group: "skills", name: "Slugger", text: "Once per quest, apply +1 stun token.", icon: "ref-status.svg" },
  { group: "skills", name: "Speed Eating", text: "Once per quest, use combat actions and preparation actions during the same turn.", icon: "ref-time.svg" },
  { group: "skills", name: "Sporepuff Expert", text: "When you recover health from anything that isn't a potion, recover 1 additional health.", icon: "ref-potion.svg" },
  { group: "skills", name: "Stun Resistance", text: "You're immune to the stun status ailment.", icon: "ref-status.svg" },
  { group: "skills", name: "Teostra Technique", text: "Once per quest, shuffle the damage cards from an attack back into the damage deck.", icon: "ref-sharpen.svg" },
  { group: "skills", name: "Thunder Attack", text: "Draw +1 damage card on thunder attacks.", icon: "ref-element.svg" },
  { group: "skills", name: "Water Attack", text: "Draw +1 damage card on water attacks.", icon: "ref-element.svg" },
  { group: "skills", name: "Weakness Exploit", text: "Attack cards with 2+ combo draw +1 damage.", icon: "ref-combo.svg" },
  { group: "skills", name: "Weakness Exploit (Rathalos Mail)", text: "Once per quest, swap your hunter token with another player, maintaining token facing.", icon: "rathalos" },
];
