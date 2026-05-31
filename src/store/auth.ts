import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { toAuthEmail, validateUsername } from "../lib/auth/email";

interface AuthState {
  userId: string | null;
  username: string | null;
  loading: boolean;
  restoreSession: () => Promise<void>;
  signUp: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signIn: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

async function fetchUsername(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("player_profile")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.username ?? null;
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  username: null,
  loading: true,

  restoreSession: async () => {
    if (!isSupabaseConfigured) {
      set({ userId: null, username: null, loading: false });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      set({ userId: null, username: null, loading: false });
      return;
    }
    const username = await fetchUsername(user.id);
    set({ userId: user.id, username, loading: false });
  },

  signUp: async (username, password) => {
    if (!navigator.onLine) return { ok: false, error: "Keine Internetverbindung." };
    if (!isSupabaseConfigured) {
      return { ok: false, error: "Supabase ist nicht konfiguriert." };
    }
    const nameErr = validateUsername(username);
    if (nameErr) return { ok: false, error: nameErr };
    if (password.length < 6) {
      return { ok: false, error: "Passwort mindestens 6 Zeichen." };
    }

    const email = toAuthEmail(username);
    const { data, error } = await supabase.auth.signUp({ email, password });
    // #region agent log
    if (error) {
      fetch("http://127.0.0.1:7881/ingest/a7cdc541-ed7c-4afe-87a4-662a27c5f95a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "b16310",
        },
        body: JSON.stringify({
          sessionId: "b16310",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "auth.ts:signUp",
          message: "signUp auth error",
          data: {
            errorMessage: error.message,
            errorStatus: error.status,
            errorCode: error.code,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    if (error) return { ok: false, error: error.message };
    const userId = data.user?.id;
    if (!userId) return { ok: false, error: "Registrierung fehlgeschlagen." };

    let session = data.session;
    if (!session) {
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInRes.error || !signInRes.data.session) {
        return {
          ok: false,
          error: "Konto erstellt. Bitte einloggen.",
        };
      }
      session = signInRes.data.session;
    }

    const { error: profileErr } = await supabase.from("player_profile").insert({
      user_id: userId,
      username: username.trim(),
    });
    if (profileErr) {
      return { ok: false, error: profileErr.message };
    }

    set({ userId, username: username.trim(), loading: false });
    return { ok: true };
  },

  signIn: async (username, password) => {
    if (!navigator.onLine) return { ok: false, error: "Keine Internetverbindung." };
    if (!isSupabaseConfigured) {
      return { ok: false, error: "Supabase ist nicht konfiguriert." };
    }
    const email = toAuthEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // #region agent log
    if (error) {
      fetch("http://127.0.0.1:7881/ingest/a7cdc541-ed7c-4afe-87a4-662a27c5f95a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "b16310",
        },
        body: JSON.stringify({
          sessionId: "b16310",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "auth.ts:signIn",
          message: "signIn auth error",
          data: {
            errorMessage: error.message,
            errorStatus: error.status,
            errorCode: error.code,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    if (error) return { ok: false, error: error.message };
    const userId = data.user?.id;
    if (!userId) return { ok: false, error: "Login fehlgeschlagen." };
    const uname = (await fetchUsername(userId)) ?? username.trim();
    set({ userId, username: uname });
    return { ok: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ userId: null, username: null });
  },
}));

/** Subscribe to Supabase auth changes (call once at app boot). */
export function initAuthListener(): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      useAuth.setState({ userId: null, username: null, loading: false });
      return;
    }
    void fetchUsername(session.user.id).then((username) => {
      useAuth.setState({
        userId: session.user.id,
        username,
        loading: false,
      });
    });
  });
  return () => data.subscription.unsubscribe();
}
