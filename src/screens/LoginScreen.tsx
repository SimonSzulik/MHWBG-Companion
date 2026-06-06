import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isSupabaseConfigured, getSupabaseConfigIssue } from "../lib/supabase";
import { useAuth } from "../store/auth";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { SegmentedTabs } from "../ui/SegmentedTabs";

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
            Trage <code>SUPABASE_URL</code> und{" "}
            <code>SUPABASE_ANON_KEY</code> in <code>.env</code> ein.
          </p>
        </div>
      </div>
    );
  }

  const configIssue = getSupabaseConfigIssue();
  if (configIssue) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6">
        <div className="paper-card p-6 text-center">
          <p className="font-display text-xl">Supabase falsch konfiguriert</p>
          <p className="mt-2 text-sm text-ink-soft">{configIssue}</p>
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

      <SegmentedTabs<Mode>
        className="mb-4 mt-6"
        value={mode}
        onChange={setMode}
        tabs={[
          { value: "login", label: "Login" },
          { value: "signup", label: "Konto erstellen" },
        ]}
      />

      <div className="paper-card flex flex-col gap-3 p-4">
        <Field
          label="Jägername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <Field
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "signup" && (
          <Field
            label="Passwort wiederholen"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          rounded="lg"
          disabled={busy || !username.trim() || !password}
          onClick={() => void submit()}
          className="py-2.5 font-semibold"
        >
          {mode === "login" ? "Einloggen" : "Konto erstellen"}
        </Button>
      </div>
    </div>
  );
}
