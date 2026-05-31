/**
 * Cloud sync engine: Supabase is the source of truth for shared campaigns.
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../supabase";
import { useCampaign } from "../../store/campaign";
import { useAuth } from "../../store/auth";
import type { Campaign, Hunter, WeaponType } from "../../domain/types";
import {
  campaignToCampaignUpdate,
  campaignToStateUpdate,
  hunterToInsert,
  hunterToUpdate,
  rowsToCampaign,
} from "./mappers";

const SYNC_CAMPAIGN_KEY = "mhwbg-active-campaign-id";

let channel: RealtimeChannel | null = null;
let unsubscribeStore: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshot = "";
let applyingRemote = false;
let activeCampaignId: string | null = null;
let reconnectAttempt = 0;

export type SyncStatus = "off" | "connecting" | "live" | "error";
type Listener = (status: SyncStatus, detail?: string) => void;
const listeners = new Set<Listener>();
let status: SyncStatus = "off";

export function onSyncStatus(fn: Listener): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

function setStatus(next: SyncStatus, detail?: string) {
  status = next;
  listeners.forEach((l) => l(next, detail));
}

function persistActiveCampaignId(id: string | null) {
  if (id) localStorage.setItem(SYNC_CAMPAIGN_KEY, id);
  else localStorage.removeItem(SYNC_CAMPAIGN_KEY);
}

export function getPersistedCampaignId(): string | null {
  return localStorage.getItem(SYNC_CAMPAIGN_KEY);
}

function requireUserId(): string | null {
  return useAuth.getState().userId;
}

/** Ensure Supabase has a valid JWT before authenticated queries/RPCs. */
async function ensureAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) {
    if (useAuth.getState().userId !== sessionUserId) {
      useAuth.setState({ userId: sessionUserId, loading: false });
    }
    return sessionUserId;
  }

  const { data: refreshed } = await supabase.auth.refreshSession();
  const refreshedUserId = refreshed.session?.user?.id;
  if (refreshedUserId) {
    useAuth.setState({ userId: refreshedUserId, loading: false });
    return refreshedUserId;
  }

  useAuth.setState({ userId: null, username: null, loading: false });
  return null;
}

/** Push local state immediately (e.g. potion use). */
export function requestImmediatePush(): void {
  const c = useCampaign.getState().campaign;
  if (c && activeCampaignId && c.id === activeCampaignId) {
    if (pushTimer) clearTimeout(pushTimer);
    void push(c);
  }
}

/**
 * Create a cloud campaign from the current local campaign and start syncing.
 * Returns the shareable join code, or an error message.
 */
export async function createCloudCampaign(
  joinCode: string,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const local = useCampaign.getState().campaign;
  if (!local || !isSupabaseConfigured) {
    return { ok: false, error: "Kampagne konnte nicht erstellt werden." };
  }
  setStatus("connecting");
  const userId = await ensureAuthUserId();
  if (!userId) {
    setStatus("error", "Nicht eingeloggt.");
    return { ok: false, error: "Nicht eingeloggt." };
  }

  const code = joinCode.trim().toUpperCase();
  const maxDay = Math.max(1, local.maxDay);

  const { data: camp, error } = await supabase
    .from("campaign")
    .insert({
      name: local.name,
      box: local.box,
      day: local.day,
      max_day: maxDay,
      owner_id: userId,
      join_code: code,
    })
    .select()
    .single();
  if (error || !camp) {
    const msg =
      error?.code === "23505"
        ? "Join-Code bereits vergeben."
        : (error?.message ?? "Kampagne konnte nicht erstellt werden.");
    setStatus("error", msg);
    return { ok: false, error: msg };
  }

  await supabase
    .from("campaign_state")
    .update(campaignToStateUpdate(local))
    .eq("campaign_id", camp.id);

  if (local.hunters.length) {
    await supabase.from("hunter").insert(
      local.hunters.map((h) => hunterToInsert(camp.id, h, userId)),
    );
    if (local.leaderId) {
      await supabase
        .from("campaign")
        .update({ leader_hunter_id: local.leaderId })
        .eq("id", camp.id);
    }
  }

  await startSync(camp.id);
  return { ok: true, code: camp.join_code };
}

export interface PeekJoinResult {
  campaignId: string;
  takenWeapons: WeaponType[];
}

/** Preview which weapons are taken before joining. */
export async function peekJoinCampaign(
  code: string,
): Promise<
  { ok: true; data: PeekJoinResult } | { ok: false; error: string }
> {
  const userId = await ensureAuthUserId();
  if (!userId) {
    return { ok: false, error: "Nicht eingeloggt. Bitte erneut anmelden." };
  }

  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc("peek_join_campaign", {
    code: normalized,
  });
  if (error) {
    const msg = error.message.includes("nicht gefunden")
      ? "Kampagne nicht gefunden."
      : error.message;
    return { ok: false, error: msg };
  }
  if (!data) {
    return { ok: false, error: "Kampagne nicht gefunden." };
  }
  const parsed = data as { campaign_id: string; taken_weapons: string[] };
  return {
    ok: true,
    data: {
      campaignId: parsed.campaign_id,
      takenWeapons: parsed.taken_weapons as WeaponType[],
    },
  };
}

/** Join campaign and create hunter, then sync. */
export async function joinCampaignWithHunter(
  code: string,
  hunterName: string,
  weaponType: WeaponType,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  setStatus("connecting");
  const userId = await ensureAuthUserId();
  if (!userId) {
    setStatus("error", "Nicht eingeloggt.");
    return false;
  }

  const { data: cid, error } = await supabase.rpc("join_campaign_hunter", {
    code: code.trim().toUpperCase(),
    hunter_name: hunterName,
    weapon_type: weaponType,
  });
  if (error || !cid) {
    setStatus("error", error?.message ?? "Beitritt fehlgeschlagen");
    return false;
  }
  await startSync(cid as string);

  const campaign = useCampaign.getState().campaign;
  const hunter = campaign?.hunters.find((h) => h.userId === userId);
  if (hunter) {
    useCampaign.getState().applyStarterKit(hunter.id);
    requestImmediatePush();
  }

  return true;
}

export interface UserCampaignSummary {
  id: string;
  name: string;
  joinCode: string;
  day: number;
  maxDay: number;
  role: "owner" | "player";
  hunterName?: string;
  weaponType?: WeaponType;
}

export interface ListUserCampaignsResult {
  campaigns: UserCampaignSummary[];
  error?: string;
}

/** All campaigns the logged-in user belongs to. */
export async function listUserCampaigns(): Promise<ListUserCampaignsResult> {
  if (!isSupabaseConfigured) return { campaigns: [] };

  const userId = await ensureAuthUserId();
  if (!userId) {
    return { campaigns: [], error: "Nicht eingeloggt." };
  }

  const { data, error } = await supabase.rpc("list_my_campaigns");
  if (error) {
    return { campaigns: [], error: error.message };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    join_code: string;
    day: number;
    max_day: number;
    role: "owner" | "player";
    hunter_name: string | null;
    weapon_type: string | null;
  }>;

  return {
    campaigns: rows.map((c) => ({
      id: c.id,
      name: c.name,
      joinCode: c.join_code,
      day: c.day,
      maxDay: c.max_day,
      role: c.role,
      hunterName: c.hunter_name ?? undefined,
      weaponType: (c.weapon_type as WeaponType | null) ?? undefined,
    })),
  };
}

/** Load a campaign from the cloud and make it the active synced save. */
export async function activateCampaign(campaignId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const userId = await ensureAuthUserId();
  if (!userId) return false;
  await stopSync();
  useCampaign.getState().resetCampaign();
  try {
    await startSync(campaignId);
    return true;
  } catch {
    setStatus("error", "Kampagne konnte nicht geladen werden.");
    return false;
  }
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
  await stopSync();
  activeCampaignId = campaignId;
  persistActiveCampaignId(campaignId);
  setStatus("connecting");
  reconnectAttempt = 0;
  await pull(campaignId);
  subscribeChannel(campaignId);

  unsubscribeStore = useCampaign.subscribe((s) => {
    if (applyingRemote || !s.campaign) return;
    if (s.campaign.id !== activeCampaignId) return;
    schedulePush(s.campaign);
  });
}

function subscribeChannel(campaignId: string) {
  channel = supabase
    .channel(`campaign:${campaignId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign_state",
        filter: `campaign_id=eq.${campaignId}`,
      },
      () => void pull(campaignId),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "hunter",
        filter: `campaign_id=eq.${campaignId}`,
      },
      () => void pull(campaignId),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign",
        filter: `id=eq.${campaignId}`,
      },
      () => void pull(campaignId),
    )
    .subscribe((s) => {
      if (s === "SUBSCRIBED") {
        reconnectAttempt = 0;
        setStatus("live");
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("error", "Realtime-Verbindung verloren");
        scheduleReconnect(campaignId);
      }
    });
}

function scheduleReconnect(campaignId: string) {
  if (reconnectTimer) return;
  const delay = Math.min(30_000, 1000 * 2 ** reconnectAttempt);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (activeCampaignId === campaignId) {
      void (async () => {
        if (channel) await supabase.removeChannel(channel);
        channel = null;
        subscribeChannel(campaignId);
      })();
    }
  }, delay);
}

/** Resume sync for a persisted campaign (app boot). */
export async function resumeSyncIfNeeded(): Promise<void> {
  const campaign = useCampaign.getState().campaign;
  const id = campaign?.id ?? getPersistedCampaignId();
  if (!id || !isSupabaseConfigured) return;
  const userId = await ensureAuthUserId();
  if (!userId) return;
  if (activeCampaignId === id && status === "live") return;
  await startSync(id);
}

/** Stop syncing and tear down subscriptions. */
export async function stopSync(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (channel) await supabase.removeChannel(channel);
  channel = null;
  activeCampaignId = null;
  setStatus("off");
}

function snapshot(c: Campaign): string {
  return JSON.stringify({
    name: c.name,
    day: c.day,
    maxDay: c.maxDay,
    zenny: c.zenny,
    items: c.items,
    leaderId: c.leaderId,
    questCompletions: c.questCompletions,
    activeQuest: c.activeQuest,
    hunters: c.hunters.map((h) => ({
      ...h,
      ownedGear: [...h.ownedGear].sort(),
    })),
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
  const userId = requireUserId();
  try {
    await supabase
      .from("campaign")
      .update(campaignToCampaignUpdate(campaign))
      .eq("id", campaign.id);

    await supabase
      .from("campaign_state")
      .update(campaignToStateUpdate(campaign))
      .eq("campaign_id", campaign.id);

    await syncHunters(campaign.id, campaign.hunters, userId);

    lastPushedSnapshot = snap;
  } catch (e) {
    setStatus("error", e instanceof Error ? e.message : String(e));
  }
}

async function syncHunters(
  campaignId: string,
  hunters: Hunter[],
  userId: string | null,
) {
  const { data: remote } = await supabase
    .from("hunter")
    .select("id")
    .eq("campaign_id", campaignId);
  const remoteIds = new Set((remote ?? []).map((r) => r.id));
  const localIds = new Set(hunters.map((h) => h.id));

  for (const h of hunters) {
    if (remoteIds.has(h.id)) {
      await supabase
        .from("hunter")
        .update(hunterToUpdate(h, userId))
        .eq("id", h.id);
    } else {
      await supabase
        .from("hunter")
        .insert(hunterToInsert(campaignId, h, userId));
    }
  }
  const toDelete = [...remoteIds].filter((id) => !localIds.has(id));
  if (toDelete.length) {
    await supabase.from("hunter").delete().in("id", toDelete);
  }
}
