import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../store/auth";

type Mode = "login" | "signup";

/** Login or create account with Jägername + password. */
export function LoginScreen() {
  const nav = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6">
        <div className="paper-card p-6 text-center">
          <p className="font-display text-xl">Supabase fehlt</p>
          <p className="mt-2 text-sm text-ink-soft">
            Trage <code>VITE_SUPABASE_URL</code> und{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> ein.
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (mode === "signup" && password !== password2) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    const res =
      mode === "login"
        ? await signIn(username, password)
        : await signUp(username, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Fehler");
      return;
    }
    nav("/onboarding", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-8">
      <h1 className="font-display text-3xl">MHWBG Companion</h1>
      <p className="mt-1 text-sm text-ink-soft">Melde dich mit deinem Jägernamen an.</p>

      <div className="mb-4 mt-6 flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg px-3 py-2 ${
            mode === "login" ? "bg-accent text-white" : "text-ink-soft"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg px-3 py-2 ${
            mode === "signup" ? "bg-accent text-white" : "text-ink-soft"
          }`}
        >
          Konto erstellen
        </button>
      </div>

      <div className="paper-card flex flex-col gap-3 p-4">
        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Jägername</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
          />
        </label>
        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
          />
        </label>
        {mode === "signup" && (
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              Passwort wiederholen
            </span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
            />
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={busy || !username.trim() || !password}
          onClick={() => void submit()}
          className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2.5 font-semibold text-white active:translate-y-px disabled:opacity-40"
        >
          {mode === "login" ? "Einloggen" : "Konto erstellen"}
        </button>
      </div>
    </div>
  );
}
