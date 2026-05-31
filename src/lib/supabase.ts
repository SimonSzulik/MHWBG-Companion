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

const url = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL as string | undefined,
);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True only when both env vars are present. Lets the UI show a helpful
 * "noch nicht konfiguriert" state instead of crashing before keys are set.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

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
