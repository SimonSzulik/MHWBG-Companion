import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Status = "checking" | "connected" | "unconfigured" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("unconfigured");
      return;
    }

    // A lightweight call that succeeds as long as the project URL + anon key
    // are valid, even before any tables exist.
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setDetail(error.message);
        } else {
          setStatus("connected");
        }
      })
      .catch((err: unknown) => {
        setStatus("error");
        setDetail(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500/80">
          Monster Hunter World
        </p>
        <h1 className="mt-1 text-3xl font-bold text-amber-100">
          Board Game Companion
        </h1>
      </div>

      <StatusCard status={status} detail={detail} />

      <p className="text-xs text-stone-500">
        Verbindungs-Gerüst · v0.0.1
      </p>
    </main>
  );
}

function StatusCard({ status, detail }: { status: Status; detail: string }) {
  const map: Record<Status, { label: string; tone: string; hint: string }> = {
    checking: {
      label: "Prüfe Verbindung…",
      tone: "border-stone-700 text-stone-300",
      hint: "Verbinde mit Supabase.",
    },
    connected: {
      label: "✓ Supabase verbunden",
      tone: "border-emerald-600/60 text-emerald-300",
      hint: "Backend erreichbar. Bereit für Schritt A.",
    },
    unconfigured: {
      label: "● Supabase noch nicht konfiguriert",
      tone: "border-amber-600/60 text-amber-300",
      hint: "Lege VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env.local an.",
    },
    error: {
      label: "✕ Verbindungsfehler",
      tone: "border-red-600/60 text-red-300",
      hint: detail || "Keys prüfen.",
    },
  };
  const s = map[status];
  return (
    <div
      className={`w-full rounded-2xl border bg-stone-900/60 px-5 py-6 ${s.tone}`}
    >
      <p className="text-lg font-semibold">{s.label}</p>
      <p className="mt-2 text-sm text-stone-400">{s.hint}</p>
    </div>
  );
}
