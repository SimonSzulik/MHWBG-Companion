# What is still missing from the catalog

_Generated 2026-08-17 by `npm run report:missing`._

Everything below needs a photograph of a physical card, because it could not be found in any rulebook, product page, forum thread or community dataset. Everything **not** listed here is either already in the app or sourced in `docs/research/mhwbg-content-dossier.md`.

## 1. Broken references

None — every material, gear, monster and quest reference resolves.

## 2. Break rewards: which part does each roll belong to?

The reward tables are transcribed, but the source records only *that* a roll is a break reward, not which part it requires. The Ancient Forest tables show the part is printed per row (Anjanath repeats “head” three times), so it cannot be inferred. Until these are filled in, **those rolls do not double**.

| Monster | Rolls to check | Parts available |
|---|---|---|
| barroth | 9, 10, 11, 12 | head, body, claws, tail |
| pukei-pukei | 6, 7, 9 | head, tail, claws |
| jyuratodus | 1, 7, 9, 12 | head, tail |
| diablos | 6, 8, 10, 12 | head, tail, claws |
| black-diablos | 6, 10, 11, 12 | head, tail, claws |

## 3. Monsters with no source data anywhere

These boxes were released after every community dataset stopped being maintained. Nothing about them is available — they need the full set below.

### kirin — Kirin (SFG exclusive)

- [ ] Quest cards: how many tiers, and the star rating of each
- [ ] Physiology card: hitpoints, elemental and status resistances, special rule
- [ ] Parts: name, armour value and break value for each
- [ ] Reward table: all 12 rolls, and which are break rewards for which part
- [ ] Part materials: exact names as printed
- [ ] Forge cards: weapon paths and costs, per weapon type
- [ ] Armour set: pieces, defence values and skills

### tzitzi-ya-ku — Picking Bones (SFG exclusive)

- [ ] Quest cards: how many tiers, and the star rating of each
- [ ] Physiology card: hitpoints, elemental and status resistances, special rule
- [ ] Parts: name, armour value and break value for each
- [ ] Reward table: all 12 rolls, and which are break rewards for which part
- [ ] Part materials: exact names as printed
- [ ] Forge cards: weapon paths and costs, per weapon type
- [ ] Armour set: pieces, defence values and skills

### great-girros — Picking Bones (SFG exclusive)

- [ ] Quest cards: how many tiers, and the star rating of each
- [ ] Physiology card: hitpoints, elemental and status resistances, special rule
- [ ] Parts: name, armour value and break value for each
- [ ] Reward table: all 12 rolls, and which are break rewards for which part
- [ ] Part materials: exact names as printed
- [ ] Forge cards: weapon paths and costs, per weapon type
- [ ] Armour set: pieces, defence values and skills

### radobaan — Picking Bones (SFG exclusive)

- [ ] Quest cards: how many tiers, and the star rating of each
- [ ] Physiology card: hitpoints, elemental and status resistances, special rule
- [ ] Parts: name, armour value and break value for each
- [ ] Reward table: all 12 rolls, and which are break rewards for which part
- [ ] Part materials: exact names as printed
- [ ] Forge cards: weapon paths and costs, per weapon type
- [ ] Armour set: pieces, defence values and skills

## 4. Forge and armour for the Wildspire monsters

Quests, reward tables and parts are done. Forge costs and armour sets are on the **forge reference cards**, which no dataset covers — the quest-card set only has quest books and physiology.

| Monster | Quests | Loot table | Forge paths | Armour set |
|---|---|---|---|---|
| barroth | yes | yes | partial | **no** |
| pukei-pukei | yes | yes | partial | **no** |
| jyuratodus | yes | yes | partial | **no** |
| diablos | yes | yes | partial | **no** |
| black-diablos | yes | yes | **no** | **no** |

Note: the app already ships *some* Wildspire weapon paths (Great Sword, Sword & Shield, Bow and Dual Blades), transcribed earlier from the forge cards. The remaining six weapon types have no Wildspire paths at all.

## 5. Values inferred rather than sourced

| What | Where | Basis for the guess |
|---|---|---|
| Quest-card colour (`type`) for the 5 Wildspire monsters | `src/data/quests.ts` | Inferred from each monster's position in the box. Cosmetic only. |
| Barroth listed first among Wildspire monsters | `QUEST_MONSTERS` | Ancient Forest rulebook p.38 — a combined campaign may open on Great Jagras **or** Barroth. |
| Jyuratodus / Diablos / Black Diablos “legs” part dropped | `BREAKABLE_PARTS` | `MonsterPartId` has no `legs`; confirm whether legs are breakable at all. |

## 6. Rules in the box that the app does not model

From the Ancient Forest rulebook appendix (p.38) — reported, not implemented:

- **Speed Run campaign** — Medium 20 days, Hard 15 days
- **Explorer campaign** — no campaign timer at all
- **Single-player campaign** — each player controls 2 hunters
- **Arena quests** — one-shot, pre-set weapons and armour, gathering phase skipped
- **Palicoes** — for 1–2 players, and as the 3–4 player difficulty reducer. Palico support was removed from the app (`palico_name` dropped from types, store, mappers and schema).
- **Combining boxes** — adding Wildspire Waste to an Ancient Forest campaign adds 20 days to the timer; the app has no notion of which boxes a group owns.

- **Elder dragons need a 5★ tier.** Kushala Daora, Nergigante and Teostra all have 1★/2★/**5★** quests, but `QuestStars` stops at four-star and there is no `five-star.png` icon.
