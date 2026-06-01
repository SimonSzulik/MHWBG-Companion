# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mobile-first PWA (React 18 + Vite + TypeScript + Tailwind v4) — a campaign tracker / character sheet for the *Monster Hunter World: The Board Game* (Ancient Forest & Wildspire Waste). Combat happens at the physical table; the app handles between-hunt bookkeeping (hunters, inventory/zenny, crafting, campaign progress) and syncs live across players via Supabase. UI copy is in German.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (PWA bundle)
npm run preview   # serve the production build
npm run lint      # tsc -b --noEmit  (type-check; there is no ESLint)
```

There is no test runner configured.

### Env / Supabase

- Env vars use the `SUPABASE_` prefix (see `vite.config.ts` `envPrefix`), not the usual `VITE_`. Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY` in `.env.local`.
- The app is fully usable without Supabase (local-first); cloud sync activates only when configured. Use `isSupabaseConfigured` from `src/lib/supabase.ts` when adding code paths that touch the network.
- DB schema lives in `supabase/schema.sql` (tables `campaign`, `campaign_member`, `hunter`, `campaign_state`; RLS on; RPCs `join_campaign`, `is_campaign_member`). Apply it via the Supabase SQL editor.

## Architecture

### Two data layers
The domain split (see header comment in `src/domain/types.ts`) is load-bearing:

1. **Static catalog** (`src/data/`) — read-only seed data shipped with the bundle: weapons, armour, materials, recipes, loot tables, quests. Edits here change game content.
2. **User/campaign state** (`src/store/`) — the mutable save (hunters, inventory, owned gear, progress). Lives in a Zustand store, persisted to `localStorage` via `zustand/middleware`'s `persist`, and mirrored to Supabase when sync is on.

`src/domain/` holds pure functions over those types (calendar, catalog lookups, loot rolling, quest rules, starter kits). Keep this layer free of React and storage concerns — both the store and screens import from it.

### State stores (Zustand)
- `src/store/auth.ts` — Supabase auth session (email magic link / anonymous). `initAuthListener()` is wired in `AppBootstrap`.
- `src/store/campaign.ts` — the single big campaign aggregate. Contains migration shims (e.g. `MATERIAL_ID_MIGRATION`) applied on hydrate; keep these when renaming catalog IDs so existing localStorage saves don't break.

### Sync engine (`src/lib/sync/engine.ts`)
Last-write-wins per field. The Zustand store is the working copy; the engine subscribes to store changes, debounces pushes to Supabase, and applies remote rows via a Realtime channel. Important invariants:
- `applyingRemote` guards against feedback loops when remote rows are folded back into the store.
- `lastPushedSnapshot` dedupes pushes.
- `CampaignGuard` in `AppBootstrap.tsx` calls `resumeSyncIfNeeded()` whenever the active campaign id changes; don't start sync from screens directly.
- Row⇄domain shape conversion is centralised in `src/lib/sync/mappers.ts`. Add new persisted fields there *and* in `supabase/schema.sql`.

### Routing & guards (`src/App.tsx`, `src/AppBootstrap.tsx`)
`useAppReady()` blocks rendering until both auth and the persisted store have hydrated. Authenticated routes are wrapped in `AuthGuard` → `CampaignGuard` → `Shell` (bottom nav + online gate + quest invite popup). Onboarding routes sit outside the campaign guard so a freshly-logged-in user can create/join a campaign. The `QuestLobbyNavGuard` inside `Shell` auto-leaves the quest lobby when the user navigates away via bottom tabs.

### PWA
`vite-plugin-pwa` precaches the build and uses SPA fallback to `/index.html`. Supabase requests bypass precache via a `NetworkFirst` runtime rule. The service worker is disabled in dev (`devOptions.enabled: false`).

### Path alias
`@/*` → `src/*` (configured in `tsconfig.json`).

## Conventions worth knowing

- TS strict mode + `noUnusedLocals`/`noUnusedParameters` — `npm run lint` will fail on dead bindings.
- Static game data in `src/data/ancientForest.ts` is verified against the rulebook; monster-part names and forge recipe costs from physical cards are marked provisional in comments. Preserve those markers when editing.
- Material icons under `public/icons/` come from an upstream project (CAPCOM assets) — don't rename without updating the catalog IDs that reference them.
