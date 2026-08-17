/**
 * Cloud sync engine: Supabase is the source of truth for shared campaigns.
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../supabase";
import { useCampaign } from "../../store/campaign";
import { useAuth } from "../../store/auth";
import type { Campaign, Hunter, WeaponType } from "../../domain/types";
import { hunterNeedsStarterKit } from "../../domain/starterKit";
import { ownHunter } from "../hunter";
import {
  campaignToCampaignUpdate,
  campaignToStateUpdate,
  hunterToInsert,
  hunterToUpdate,
  rowsToCampaign,
} from "./mappers";

const SYNC_CAMPAIGN_KEY = "mhwbg-active-campaign-id";

/** Debounce for coalescing local edits into one push. */
const PUSH_DEBOUNCE = 500;
/** Debounce for coalescing realtime events into one pull. */
const SOFT_PULL_DEBOUNCE = 300;

/** Last-pushed snapshot of each table section, to skip unchanged writes. */
interface PushSnaps {
  meta: string;
  state: string;
  /** `active_quest`, tracked separately because it is written via RPC. */
  quest: string;
  hunters: Record<string, string>;
}

let channel: RealtimeChannel | null = null;
let unsubscribeStore: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let softPullTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshot = "";
let lastSnaps: PushSnaps | null = null;
let pushInFlight = false;
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

/** Push local state immediately (e.g. after creating/joining a campaign). */
export function requestImmediatePush(): void {
  const c = useCampaign.getState().campaign;
  if (c && activeCampaignId && c.id === activeCampaignId) {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
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
      // Must be written here, not left to the column default: startSync pulls
      // the row straight back, so a default would silently replace the boxes
      // the player just picked.
      boxes: local.boxes,
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
      local.hunters.map((h) => hunterToInsert(camp.id, h, h.userId ?? userId)),
    );
    if (local.leaderId) {
      await supabase
        .from("campaign")
        .update({ leader_hunter_id: local.leaderId })
        .eq("id", camp.id);
    }
  }

  await startSync(camp.id);
  ensureOwnHuntersStarterKits(userId);
  return { ok: true, code: camp.join_code };
}

export interface PeekJoinResult {
  campaignId: string;
  takenWeapons: WeaponType[];
  alreadyMember: boolean;
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
  const parsed = data as {
    campaign_id: string;
    taken_weapons: string[];
    already_member?: boolean;
  };
  return {
    ok: true,
    data: {
      campaignId: parsed.campaign_id,
      takenWeapons: parsed.taken_weapons as WeaponType[],
      alreadyMember: Boolean(parsed.already_member),
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

  const hunter = useCampaign
    .getState()
    .campaign?.hunters.find((h) => h.userId === userId);
  if (hunter) {
    useCampaign.getState().forceStarterKit(hunter.id);
    requestImmediatePush();
  }

  return true;
}

/** Repair starter kits for own hunter(s) after create, then sync if needed. */
function ensureOwnHuntersStarterKits(userId: string): void {
  const campaign = useCampaign.getState().campaign;
  if (!campaign) return;
  let changed = false;
  for (const h of campaign.hunters) {
    if (h.userId !== userId) continue;
    if (!hunterNeedsStarterKit(h)) continue;
    useCampaign.getState().applyStarterKit(h.id);
    changed = true;
  }
  if (changed) requestImmediatePush();
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

  const { data: membership } = await supabase
    .from("campaign_member")
    .select("user_id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) {
    setStatus("error", "Kein Zugriff auf diese Kampagne.");
    return false;
  }

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

/** Fetch the three campaign rows and assemble the domain shape (no store write). */
async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
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
  return rowsToCampaign(camp, state ?? null, hunters ?? []);
}

/** Fold a freshly-fetched campaign into the store and reset push baselines. */
function applyRemote(campaign: Campaign): void {
  applyingRemote = true;
  useCampaign.getState().applyRemoteCampaign(campaign);
  applyingRemote = false;
  lastPushedSnapshot = snapshot(campaign);
  lastSnaps = pushSnapsOf(campaign);
}

/** Pull the full campaign from the cloud into the local store (forced apply). */
export async function pull(campaignId: string): Promise<Campaign | null> {
  const campaign = await fetchCampaign(campaignId);
  if (!campaign) return null;
  applyRemote(campaign);
  return campaign;
}

/**
 * Realtime-triggered pull. Coalesces bursts of row events and — crucially —
 * skips our own write echoes and never clobbers newer local edits, so adding
 * items doesn't fight the network round-trip.
 */
function scheduleSoftPull(campaignId: string): void {
  if (softPullTimer) clearTimeout(softPullTimer);
  softPullTimer = setTimeout(() => {
    softPullTimer = null;
    void softPull(campaignId);
  }, SOFT_PULL_DEBOUNCE);
}

async function softPull(campaignId: string): Promise<void> {
  if (activeCampaignId !== campaignId) return;
  // Don't fight our own pending/in-flight writes — retry once they settle.
  if (pushInFlight || pushTimer) {
    scheduleSoftPull(campaignId);
    return;
  }
  const campaign = await fetchCampaign(campaignId);
  if (!campaign || activeCampaignId !== campaignId) return;
  if (pushInFlight || pushTimer) {
    scheduleSoftPull(campaignId);
    return;
  }
  const remoteSnap = snapshot(campaign);
  if (remoteSnap === lastPushedSnapshot) return; // our own echo — nothing new
  const local = useCampaign.getState().campaign;
  if (local && lastPushedSnapshot && snapshot(local) !== lastPushedSnapshot) {
    // Local edits not yet pushed — don't clobber in-progress work.
    return;
  }
  if (local && remoteSnap === snapshot(local)) {
    // Already in sync; just refresh baselines.
    lastPushedSnapshot = remoteSnap;
    lastSnaps = pushSnapsOf(campaign);
    return;
  }
  applyRemote(campaign);
}

/** Begin live sync for a campaign: pull, subscribe, and watch local changes. */
export async function startSync(campaignId: string): Promise<void> {
  await stopSync();
  activeCampaignId = campaignId;
  persistActiveCampaignId(campaignId);
  setStatus("connecting");
  reconnectAttempt = 0;
  lastSnaps = null;
  lastPushedSnapshot = "";
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
      () => scheduleSoftPull(campaignId),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "hunter",
        filter: `campaign_id=eq.${campaignId}`,
      },
      () => scheduleSoftPull(campaignId),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign",
        filter: `id=eq.${campaignId}`,
      },
      () => scheduleSoftPull(campaignId),
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

  const { data: membership } = await supabase
    .from("campaign_member")
    .select("user_id")
    .eq("campaign_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) {
    await stopSync();
    useCampaign.getState().resetCampaign();
    return;
  }

  if (activeCampaignId === id && status === "live") return;
  await startSync(id);
}

/** Stop syncing and tear down subscriptions. */
export async function stopSync(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  if (softPullTimer) clearTimeout(softPullTimer);
  softPullTimer = null;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (channel) await supabase.removeChannel(channel);
  channel = null;
  activeCampaignId = null;
  lastSnaps = null;
  lastPushedSnapshot = "";
  pushInFlight = false;
  setStatus("off");
}

/**
 * Deterministic JSON: object keys sorted recursively (arrays keep their order).
 * Postgres `jsonb` does not preserve key order, so a pulled row must canonicalise
 * to the same string we wrote — that's what lets us recognise our own echoes.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

/** Per-hunter wire snapshot (excludes client-only fields like weaponStock). */
function hunterSnap(h: Hunter): string {
  return stableStringify(hunterToUpdate(h));
}

/** Per-section wire snapshots used to skip unchanged table writes. */
function pushSnapsOf(c: Campaign): PushSnaps {
  return {
    meta: stableStringify(campaignToCampaignUpdate(c)),
    // `active_quest` no longer travels in the column update (it goes through
    // merge_active_quest), but it must still take part in the dirty check or a
    // quest-only change would never be pushed.
    state: stableStringify(campaignToStateUpdate(c)),
    quest: stableStringify(c.activeQuest ?? null),
    hunters: Object.fromEntries(c.hunters.map((h) => [h.id, hunterSnap(h)])),
  };
}

/**
 * Stable snapshot of everything that round-trips through the cloud. Derived from
 * the same mappers used to write, so a freshly-pulled remote and the local copy
 * produce an identical string when they agree — that's what lets us detect (and
 * skip) our own realtime echoes.
 */
function snapshot(c: Campaign): string {
  const snaps = pushSnapsOf(c);
  const ids = Object.keys(snaps.hunters).sort();
  return JSON.stringify({
    meta: snaps.meta,
    state: snaps.state,
    quest: snaps.quest,
    hunters: ids.map((id) => [id, snaps.hunters[id]]),
  });
}

function schedulePush(campaign: Campaign) {
  if (snapshot(campaign) === lastPushedSnapshot) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void push(campaign);
  }, PUSH_DEBOUNCE);
}

async function push(campaign: Campaign): Promise<void> {
  if (!activeCampaignId || campaign.id !== activeCampaignId) return;
  const userId = requireUserId();
  const snaps = pushSnapsOf(campaign);
  // Record the intended remote state up front so our own realtime echo is
  // recognised (and skipped) even if it arrives before the writes resolve.
  lastPushedSnapshot = snapshot(campaign);
  pushInFlight = true;
  try {
    if (!lastSnaps || snaps.meta !== lastSnaps.meta) {
      await supabase
        .from("campaign")
        .update(campaignToCampaignUpdate(campaign))
        .eq("id", campaign.id);
    }
    if (!lastSnaps || snaps.state !== lastSnaps.state) {
      await supabase
        .from("campaign_state")
        .update(campaignToStateUpdate(campaign))
        .eq("campaign_id", campaign.id);
    }
    if (!lastSnaps || snaps.quest !== lastSnaps.quest) {
      await pushActiveQuest(campaign, userId);
    }
    await syncHunters(campaign.id, campaign.hunters, userId, snaps.hunters);
    lastSnaps = snaps;
  } catch (e) {
    // Force a full diff on the next attempt.
    lastSnaps = null;
    lastPushedSnapshot = "";
    setStatus("error", e instanceof Error ? e.message : String(e));
    // Don't silently drop the edit: retry the latest store state shortly so a
    // transient failure doesn't strand local changes (e.g. trades, quest start).
    const latest = useCampaign.getState().campaign;
    if (latest && latest.id === activeCampaignId) {
      schedulePush(latest);
    }
  } finally {
    pushInFlight = false;
  }
}

/**
 * Write `active_quest` through the `merge_active_quest` RPC rather than as a
 * plain column update.
 *
 * The blob carries per-hunter sub-state (`readyHunterIds`, `lootProgress`,
 * `investigationLoot`). Under plain last-write-wins, two players tapping "join"
 * — or the whole party confirming loot at once, which is the normal case at a
 * table — would each push a blob built from their own snapshot and silently
 * drop the other's entry. The RPC applies only *this* hunter's entries on top
 * of the stored row, under a row lock. See docs/qa/e2e-report.md (QA-1, QA-2).
 */
async function pushActiveQuest(campaign: Campaign, userId: string | null) {
  const quest = campaign.activeQuest ?? null;
  const hunterId = ownHunter(campaign, userId)?.id;
  if (!hunterId) {
    // No hunter of our own in this campaign (e.g. mid-join): fall back to a
    // direct write, since there are no per-hunter entries we could own.
    await supabase
      .from("campaign_state")
      .update({ active_quest: quest })
      .eq("campaign_id", campaign.id);
    return;
  }
  const { error } = await supabase.rpc("merge_active_quest", {
    p_campaign_id: campaign.id,
    p_quest: quest,
    p_hunter_id: hunterId,
  });
  if (error) throw error;
}

/**
 * Upsert only the hunters whose data changed since the last push, and delete any
 * removed since then — no per-push SELECT round-trip.
 */
async function syncHunters(
  campaignId: string,
  hunters: Hunter[],
  userId: string | null,
  hunterSnaps: Record<string, string>,
) {
  const dirty = hunters.filter(
    (h) => !lastSnaps || lastSnaps.hunters[h.id] !== hunterSnaps[h.id],
  );
  if (dirty.length) {
    await supabase
      .from("hunter")
      .upsert(dirty.map((h) => hunterToInsert(campaignId, h, h.userId ?? userId)));
  }
  if (lastSnaps) {
    const currentIds = new Set(hunters.map((h) => h.id));
    const removed = Object.keys(lastSnaps.hunters).filter(
      (id) => !currentIds.has(id),
    );
    if (removed.length) {
      await supabase.from("hunter").delete().in("id", removed);
    }
  }
}
