# MHW Board Game Companion

Mobile-first **PWA** (React + Vite + TypeScript) als Kampagnen-Tracker & Charakterbogen
für **Monster Hunter World: The Board Game** (Wildspire Waste).

Der Kampf bleibt physisch am Tisch — die App übernimmt die Buchhaltung *zwischen*
den Jagden: Hunter, Inventar/Zenny, Crafting und Kampagnen-Fortschritt, geteilt &
live synchronisiert über **Supabase**.

## Tech-Stack

| Bereich       | Technologie                       |
| ------------- | --------------------------------- |
| Framework     | React + Vite + TypeScript         |
| Styling / UI  | Tailwind CSS (+ shadcn/ui geplant)|
| Backend       | Supabase (Postgres, Auth, Realtime)|
| Server-State  | TanStack Query (geplant)          |
| Hosting       | Vercel                            |

## Status

🚧 **Verbindungs-Gerüst** — minimales lauffähiges Projekt mit Supabase-Anbindung
und Verbindungs-Test-Screen. Feature-Scaffold (Navigation, DB-Schema, Module) folgt.

## Setup (lokal)

```bash
npm install
cp .env.example .env.local   # Werte eintragen (siehe unten)
npm run dev
```

### Supabase verbinden

1. Auf [supabase.com](https://supabase.com) ein neues Projekt anlegen.
2. **Project Settings → API** öffnen.
3. `Project URL` und `anon public` Key kopieren.
4. In `.env.local` als `VITE_SUPABASE_URL` bzw. `VITE_SUPABASE_ANON_KEY` eintragen.
5. `npm run dev` — der Status-Screen zeigt **✓ Supabase verbunden**.

### Vercel verbinden (Deployment)

1. Auf [vercel.com](https://vercel.com) **Add New → Project** und das GitHub-Repo importieren.
2. Framework Preset: **Vite** (wird automatisch erkannt).
3. Unter **Environment Variables** dieselben zwei Variablen hinterlegen
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Deploy.

> Die `anon`-Keys sind clientseitig öffentlich — der Datenschutz läuft über
> Supabase **Row Level Security (RLS)**, das mit dem DB-Schema eingerichtet wird.
> `.env.local` wird **nie** committet.
