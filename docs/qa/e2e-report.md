# E2E test report — MHWBG Companion

**Target:** the live production deployment `https://project-pth47.vercel.app`
(Vercel project `mhwbg`, commit `dc0ecca`), backed by the real Supabase project
`Companion` (`vdapgkamfdbaifmziszo`).

**Method:** Playwright, Chromium, 390×844 @3x (Pixel-class phone). Three real
accounts — `qa-aki`, `qa-brand`, `qa-cyra` — created through the app's own
sign-up form, each in an isolated browser context so a single spec drives three
players against one campaign simultaneously. Assertions run against both the UI
and Postgres, so a green test means the state actually persisted.

The deployment has Vercel SSO protection on all `*.vercel.app` URLs; the suite
gets in with a `_vercel_share` token (`E2E_SHARE_TOKEN`), which sets a bypass
cookie on first navigation.

```bash
E2E_SHARE_TOKEN=<token> npm run test:e2e
```

**Result: 16 tests, 14 passing, 2 reproducing known bugs** (encoded with
`test.fail()`, so the suite is green today and turns red the moment either bug
is fixed).

---

## Findings

### QA-1 — Concurrent lobby joins silently drop a hunter · **high**

**Reproduces every run** (5/5). `tests/e2e/sync-race.spec.ts`.

When two hunters open the quest lobby at the same moment, only one ends up in
`readyHunterIds`. The lobby then never reaches "all ready", so the hunt can only
be started with the **"Start now (test)"** escape hatch. The dropped hunter's own
client believes it is ready, so it never retries.

Observed server state after both hunters joined:

```json
{ "phase": "lobby",
  "readyHunterIds": ["<aki>", "<one of brand|cyra>"],   // third is missing
  "startedByHunterId": "<aki>" }
```

**Root cause.** `campaign_state.active_quest` is a single `jsonb` column that
holds every hunter's sub-state, while the sync engine is last-write-wins *per
column* (`src/lib/sync/engine.ts`). `joinQuest` in `src/store/campaign.ts:913`
computes `readyHunterIds: [...aq.readyHunterIds, hunterId]` from the client's own
snapshot. Two clients each build a full blob from a pre-join snapshot and push
it; the second push overwrites the first. Nothing in the engine can recover it,
because at the column level the write is not a conflict — it is just newer.

**Why it matters:** this is the normal case at a physical table, not an edge
case. Everyone taps "join" when the quest starts.

### QA-2 — Concurrent loot confirmations are lost · **high**

**Reproduces every run** (3/3). Same spec, same root cause.

With all three hunters on the loot screen confirming at once, one hunter's
`choice` and `confirmed` flag are dropped:

```json
"lootProgress": {
  "<h1>": { "dice": [2,5], "confirmed": false },                        // clobbered
  "<h2>": { "dice": [1,2], "choice": "die1", "confirmed": true,
            "lootQuantities": { "monster-bone-small": 1 } },
  "<h3>": { "dice": [6,6], "choice": "die1", "confirmed": true,
            "lootQuantities": { "great-jagras-claw": 1 } }
}
```

The quest then cannot reach the summary phase, because that requires every
hunter to be confirmed — the party is stuck on the loot screen, and the affected
hunter loses their roll.

**Suggested fix for QA-1 + QA-2 (one fix, both bugs).** Make the per-hunter
mutations atomic in Postgres instead of read-modify-write on the client. Two
`security definer` RPCs alongside the existing `join_campaign` family in
`supabase/schema.sql`:

- `quest_set_ready(campaign_id, hunter_id, ready boolean)` — adds/removes one id
  in `active_quest->'readyHunterIds'`
- `quest_set_loot(campaign_id, hunter_id, progress jsonb)` — sets
  `active_quest->'lootProgress'->hunter_id`

Both return the updated `active_quest` for the client to adopt. Concurrent calls
then serialise in the database. The same reasoning applies to
`investigationLoot` and to `activeDowntime`'s per-hunter confirmations, which
are the same shape and were not separately tested.

### QA-3 — "Beitreten" is German in an otherwise English UI · **low**

`src/ui/QuestInvitePopup.tsx:57`. The quest-invite popup's join button is the
only German string on that path; the rest of the screen is English.

### QA-4 — Calendar heading truncates to "CALENDAR · 2…" · **low**

Visible on Camp at 390 px (`docs/screenshots/camp-owner-fresh.png`). The card
title plus day count does not fit the column.

### QA-5 — Quest board hard-codes "Ancient Forest" · **low**

`src/screens/QuestScreen.tsx:76` prints the box name as a literal, so it will be
wrong for any other box. Relevant to the planned per-box work.

---

## Coverage

Verified end to end, against both UI and database:

| Area | Status |
|---|---|
| Sign-up, sign-in, `player_profile` row creation | pass |
| Campaign creation (name, join code, weapon, potions, length) | pass |
| Join by code; campaign hub lists it for every member | pass |
| **Weapon exclusivity** — a claimed weapon is disabled for others | pass |
| Invalid join code rejected; already-a-member offers "Open campaign" | pass |
| Quest board tier gating (1★ open, 2★/3★/4★ locked with reason) | pass |
| Lobby: does **not** release the hunt at 2 of 3 ready; releases at 3 of 3 | pass |
| Investigation: only the quest starter may finish or cancel | pass |
| Active hunt → Completed → looting transition | pass |
| Per-hunter loot: dice, die/sum choice, personal-loot confirmation | pass |
| Party summary → day 1→2, `hunts_completed` recorded, quest cleared | pass |
| Assigned quest caps at one completion, then unlocks the investigation tier | pass |
| No unexpected `alert()` rule violations during a full hunt | pass |
| Concurrent lobby joins | **fail — QA-1** |
| Concurrent loot confirmations | **fail — QA-2** |

Not yet exercised — these remain open for the next pass: inventory tabs and
quantity editing, forge crafting (weapon tree + armour set), party trading,
downtime (all five activities and the all-hunters-confirm gate), the Handler
quest, the Reference/Info search, Settings (backup export/import, leave
campaign), the offline/sync-error gates, and PWA install + service worker.

## Notes on method

- A campaign is created fresh per spec, prefixed `QA `, so runs do not interfere.
  Accounts are reused across runs (sign-up falls back to sign-in).
- **The production database is not empty.** Supabase's `list_tables` reports
  row counts from stale planner statistics and showed 0 for every table; the
  project actually holds 9 pre-existing campaigns from June 2026 with real
  progress (up to day 12, one with 4 hunters). No QA test touched them — every
  account and campaign the suite creates is namespaced (`qa-*` / `QA …`) — but
  the risk assessment that preceded this run was based on a wrong number.
  **Teardown must delete by prefix, never truncate.** As of this report the QA
  data (22 campaigns, 6 accounts) is still present and awaiting cleanup.
- Two earlier "failures" were **my test's fault, not the app's**, and are
  recorded here so they are not mistaken for defects: a strict-mode selector
  collision on the word "Investigation", and an assumption that a cleared 1★
  quest shows a `1/1` counter when it correctly shows "Completed!".
- One transient symptom — a hunter's page bouncing to Camp mid-quest — turned out
  to be a consequence of QA-1 rather than a separate bug.
