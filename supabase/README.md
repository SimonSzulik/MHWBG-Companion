# Supabase Setup

Cloud sync for shared campaigns. The app works fully **local-first** without
this — Supabase adds multi-device / multi-player live sync on top.

## 1. Schema einspielen

1. Im Supabase-Dashboard → **SQL Editor**.
2. Inhalt von [`schema.sql`](./schema.sql) einfügen und ausführen.

Das legt Tabellen (`campaign`, `campaign_member`, `hunter`, `campaign_state`),
Row-Level-Security-Policies, Trigger und die RPCs `join_campaign` /
`is_campaign_member` an und aktiviert Realtime.

## 2. Auth aktivieren

- **Authentication → Providers**: *Email* (Magic Link) und/oder *Anonymous*
  aktivieren. Anonymous reicht für den schnellen Start am Spieltisch.

## 3. Keys in die App

- **Project Settings → API** → `Project URL` + `anon public` Key.
- Lokal in `.env.local`:
  ```
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  ```
- In Vercel als Environment Variables hinterlegen (gleiche zwei Namen).

## Sicherheitsmodell

- RLS ist auf allen Tabellen **an**. Zugriff hängt einzig an der
  Mitgliedschaft (`campaign_member`), geprüft via `is_campaign_member()`.
- Beitreten läuft über die `join_campaign(code)`-RPC (SECURITY DEFINER), damit
  Join-Codes nicht über Tabellen-Reads erratbar sind.
- Die `anon`-Keys sind öffentlich (clientseitig) — der Schutz liegt in RLS.

## Sync-Strategie (geplant)

- Der lokale Zustand (Zustand-Store) bleibt die Arbeitskopie (offline-fähig).
- Ein Sync-Layer spiegelt `campaign_state` + `hunter` per Realtime und
  schreibt Änderungen optimistisch zurück. Schreibvorgänge passieren vor/nach
  dem Hunt (selten mit Konflikten), daher genügt „last-write-wins" pro Feld.
