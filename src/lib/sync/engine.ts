/**
 * Cloud sync engine: mirrors the local campaign store to Supabase.
 *
 * Design (matches the "board game" usage pattern):
 *  - Local store stays the working copy — the app is fully usable offline.
 *  - On connect we PULL the remote campaign, then keep a Realtime subscription
 *    open so other players' changes arrive live (applied via
 *    applyRemoteCampaign, which does not re-trigger a push).
 *  - Local changes are pushed with a short debounce. Writes happen before/
 *    after a hunt, rarely concurrently, so per-field last-write-wins is fine.
 *
 * Nothing here runs unless Supabase is configured AND a sync session is
 * explicitly started, so the local-first MVP is unaffected.
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../supabase";
import { useCampaign } from "../../store/campaign";
import type { Campaign, Hunter } from "../../domain/types";
import {
  campaignToCampaignUpdate,
  campaignToStateUpdate,
  hunterToInsert,
  hunterToUpdate,
  rowsToCampaign,
} from "./mappers";

let channel: RealtimeChannel | null = null;
let unsubscribeStore: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshot = "";
/** When true we're applying a remote update — don't echo it back as a push. */
let applyingRemote = false;
let activeCampaignId: string | null = null;

export type SyncStatus = "off" | "connecting" | "live" | "error";
type Listener = (status: SyncStatus, detail?: string) => void;
const listeners = new Set<Listener>();
let status: SyncStatus = "off";

export function onSyncStatus(fn: Listener): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}
function setStatus(next: SyncStatus, detail?: string) {
  status = next;
  listeners.forEach((l) => l(next, detail));
}

/** Ensure there is an auth session (anonymous is fine for quick start). */
export async function ensureAuth(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) {
    setStatus("error", error.message);
    return null;
  }
  return anon.user?.id ?? null;
}

/**
 * Create a cloud campaign from the current local campaign and start syncing.
 * Returns the shareable join code.
 */
export async function createCloudCampaign(): Promise<string | null> {
  const local = useCampaign.getState().campaign;
  if (!local || !isSupabaseConfigured) return null;
  setStatus("connecting");
  const userId = await ensureAuth();
  if (!userId) return null;

  // Insert campaign; trigger creates membership + empty state row.
  const { data: camp, error } = await supabase
    .from("campaign")
    .insert({
      name: local.name,
      box: local.box,
      day: local.day,
      max_day: local.maxDay,
      owner_id: userId,
    })
    .select()
    .single();
  if (error || !camp) {
    setStatus("error", error?.message);
    return null;
  }

  // Push current state + hunters up.
  await supabase
    .from("campaign_state")
    .update(campaignToStateUpdate(local))
    .eq("campaign_id", camp.id);
  if (local.hunters.length) {
    await supabase
      .from("hunter")
      .insert(local.hunters.map((h) => hunterToInsert(camp.id, h)));
    if (local.leaderId) {
      await supabase
        .from("campaign")
        .update({ leader_hunter_id: local.leaderId })
        .eq("id", camp.id);
    }
  }

  await startSync(camp.id);
  return camp.join_code;
}

/** Join an existing campaign by code, pull it, and start syncing. */
export async function joinCloudCampaign(code: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  setStatus("connecting");
  const userId = await ensureAuth();
  if (!userId) return false;

  const { data: cid, error } = await supabase.rpc("join_campaign", {
    code: code.trim(),
  });
  if (error || !cid) {
    setStatus("error", error?.message ?? "Beitritt fehlgeschlagen");
    return false;
  }
  await startSync(cid as string);
  return true;
}

/** Pull the full campaign from the cloud into the local store. */
export async function pull(campaignId: string): Promise<Campaign | null> {
  const [{ data: camp }, { data: state }, { data: hunters }] =
    await Promise.all([
      supabase.from("campaign").select("*").eq("id", campaignId).single(),
      supabase
        .from("campaign_state")
        .select("*")
        .eq("campaign_id", campaignId)
        .maybeSingle(),
      supabase.from("hunter").select("*").eq("campaign_id", campaignId),
    ]);
  if (!camp) return null;
  const campaign = rowsToCampaign(camp, state ?? null, hunters ?? []);
  applyingRemote = true;
  useCampaign.getState().applyRemoteCampaign(campaign);
  applyingRemote = false;
  lastPushedSnapshot = snapshot(campaign);
  return campaign;
}

/** Begin live sync for a campaign: pull, subscribe, and watch local changes. */
export async function startSync(campaignId: string): Promise<void> {
  activeCampaignId = campaignId;
  await pull(campaignId);

  // Realtime: any change to this campaign's rows → re-pull and apply.
  channel = supabase
    .channel(`campaign:${campaignId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "campaign_state", filter: `campaign_id=eq.${campaignId}` },
      () => void pull(campaignId),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "hunter", filter: `campaign_id=eq.${campaignId}` },
      () => void pull(campaignId),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "campaign", filter: `id=eq.${campaignId}` },
      () => void pull(campaignId),
    )
    .subscribe((s) => {
      if (s === "SUBSCRIBED") setStatus("live");
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT")
        setStatus("error", "Realtime-Verbindung verloren");
    });

  // Watch local store → debounce-push diffs.
  unsubscribeStore = useCampaign.subscribe((s) => {
    if (applyingRemote || !s.campaign) return;
    if (s.campaign.id !== activeCampaignId) return;
    schedulePush(s.campaign);
  });
}

/** Stop syncing and tear down subscriptions. */
export async function stopSync(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (channel) await supabase.removeChannel(channel);
  channel = null;
  activeCampaignId = null;
  setStatus("off");
}

/* ----------------------------- internals ----------------------------- */

function snapshot(c: Campaign): string {
  // Order-independent enough for change detection.
  return JSON.stringify({
    name: c.name,
    day: c.day,
    maxDay: c.maxDay,
    zenny: c.zenny,
    materials: c.materials,
    items: c.items,
    ownedGear: [...c.ownedGear].sort(),
    leaderId: c.leaderId,
    questCompletions: c.questCompletions,
    hunters: c.hunters,
  });
}

function schedulePush(campaign: Campaign) {
  const snap = snapshot(campaign);
  if (snap === lastPushedSnapshot) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(campaign), 600);
}

async function push(campaign: Campaign): Promise<void> {
  if (!activeCampaignId) return;
  const snap = snapshot(campaign);
  try {
    await supabase
      .from("campaign")
      .update(campaignToCampaignUpdate(campaign))
      .eq("id", campaign.id);

    await supabase
      .from("campaign_state")
      .update(campaignToStateUpdate(campaign))
      .eq("campaign_id", campaign.id);

    await syncHunters(campaign.id, campaign.hunters);

    lastPushedSnapshot = snap;
  } catch (e) {
    setStatus("error", e instanceof Error ? e.message : String(e));
  }
}

/** Upsert present hunters and delete those removed locally. */
async function syncHunters(campaignId: string, hunters: Hunter[]) {
  const { data: remote } = await supabase
    .from("hunter")
    .select("id")
    .eq("campaign_id", campaignId);
  const remoteIds = new Set((remote ?? []).map((r) => r.id));
  const localIds = new Set(hunters.map((h) => h.id));

  // upsert
  for (const h of hunters) {
    if (remoteIds.has(h.id)) {
      await supabase.from("hunter").update(hunterToUpdate(h)).eq("id", h.id);
    } else {
      await supabase.from("hunter").insert(hunterToInsert(campaignId, h));
    }
  }
  // delete removed
  const toDelete = [...remoteIds].filter((id) => !localIds.has(id));
  if (toDelete.length) {
    await supabase.from("hunter").delete().in("id", toDelete);
  }
}
