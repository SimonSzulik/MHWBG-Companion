import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** Project root URL only — not the PostgREST `/rest/v1` path from the dashboard. */
export function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/i, "");
}

const rawUrl = import.meta.env.SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.SUPABASE_ANON_KEY as string | undefined;
const url = normalizeSupabaseUrl(rawUrl);
const anonKey = rawAnonKey;

function jwtRef(key: string | undefined): string | null {
  if (!key?.startsWith("eyJ")) return null;
  try {
    const payload = JSON.parse(atob(key.split(".")[1] ?? ""));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

/**
 * True only when both env vars are present. Lets the UI show a helpful
 * "noch nicht konfiguriert" state instead of crashing before keys are set.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Detect common misconfiguration (e.g. URL pasted as anon key on Vercel). */
export function getSupabaseConfigIssue(): string | null {
  if (!url || !anonKey) return null;
  const looksLikeJwt =
    anonKey.startsWith("eyJ") && anonKey.split(".").length === 3;
  if (anonKey.includes("supabase.co") && !looksLikeJwt) {
    return "SUPABASE_ANON_KEY enthält die Projekt-URL statt des Anon Keys. In Vercel/Supabase: Settings → API → anon public key (JWT) eintragen.";
  }
  if (!looksLikeJwt) {
    return "SUPABASE_ANON_KEY ist kein gültiger Anon Key (JWT). Prüfe die Werte in Vercel → Environment Variables.";
  }
  const hostRef = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  const keyRef = jwtRef(anonKey);
  if (hostRef && keyRef && hostRef !== keyRef) {
    return "SUPABASE_URL und SUPABASE_ANON_KEY gehören zu unterschiedlichen Supabase-Projekten.";
  }
  return null;
}

/**
 * Shared Supabase client, typed against the DB schema (see
 * supabase/schema.sql). Falls back to placeholder values when env vars are
 * missing so imports never throw at module load — guard usage with
 * `isSupabaseConfigured` instead.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
);
