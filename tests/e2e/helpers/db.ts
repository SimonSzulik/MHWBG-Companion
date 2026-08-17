import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { QA_PASSWORD, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Server-state assertions. The suite drives the UI, but a lot of what it needs
 * to prove ("did the loot actually persist?", "did B's row change when A acted?")
 * is only observable in Postgres. These helpers read it back through the same
 * anon key + RLS path the app uses, so they also exercise the policies.
 */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Sign a QA hunter in out-of-band and return an authenticated client. */
export async function clientFor(hunterName: string): Promise<SupabaseClient> {
  const client = anonClient();
  const email = `${hunterName.toLowerCase()}@mhwbg.local`;
  const { error } = await client.auth.signInWithPassword({ email, password: QA_PASSWORD });
  if (error) throw new Error(`clientFor(${hunterName}) failed: ${error.message}`);
  return client;
}

export async function campaignByJoinCode(client: SupabaseClient, joinCode: string) {
  const { data, error } = await client
    .from("campaign")
    .select("*")
    .eq("join_code", joinCode)
    .maybeSingle();
  if (error) throw new Error(`campaignByJoinCode: ${error.message}`);
  return data;
}

export async function huntersOf(client: SupabaseClient, campaignId: string) {
  const { data, error } = await client
    .from("hunter")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at");
  if (error) throw new Error(`huntersOf: ${error.message}`);
  return data ?? [];
}

export async function stateOf(client: SupabaseClient, campaignId: string) {
  const { data, error } = await client
    .from("campaign_state")
    .select("*")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (error) throw new Error(`stateOf: ${error.message}`);
  return data;
}

/**
 * Poll until `predicate` holds, for assertions on realtime propagation where
 * the write is made by a *different* client.
 */
export async function waitFor<T>(
  read: () => Promise<T>,
  predicate: (value: T) => boolean,
  { timeout = 20_000, interval = 500 } = {},
): Promise<T> {
  const deadline = Date.now() + timeout;
  let last: T = await read();
  while (Date.now() < deadline) {
    if (predicate(last)) return last;
    await new Promise((r) => setTimeout(r, interval));
    last = await read();
  }
  throw new Error(`waitFor timed out after ${timeout}ms; last value: ${JSON.stringify(last)}`);
}
