/**
 * Translate between the local `Campaign` shape (store) and the flat Supabase
 * rows (campaign + campaign_state + hunter[]). Kept pure and isolated so the
 * sync engine and tests can reason about one direction at a time.
 */
import type {
  ActiveQuest,
  CalendarDayEntry,
  Campaign,
  GearSlot,
  Hunter,
  HunterLootProgress,
  MaterialStash,
  WeaponType,
} from "../../domain/types";
import type { Database } from "../database.types";

type CampaignRow = Database["public"]["Tables"]["campaign"]["Row"];
type StateRow = Database["public"]["Tables"]["campaign_state"]["Row"];
type HunterRow = Database["public"]["Tables"]["hunter"]["Row"];

function parseQuestCompletions(
  raw: Record<string, boolean | number> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw) return out;
  for (const [id, val] of Object.entries(raw)) {
    if (typeof val === "boolean") out[id] = val ? 1 : 0;
    else if (typeof val === "number") out[id] = Math.max(0, Math.floor(val));
  }
  return out;
}

function parseDayLog(
  raw: Record<string, CalendarDayEntry> | null | undefined,
): Record<number, CalendarDayEntry> {
  const out: Record<number, CalendarDayEntry> = {};
  if (!raw) return out;
  for (const [key, val] of Object.entries(raw)) {
    const day = Number(key);
    if (!Number.isFinite(day) || day < 1 || !val?.monsterId || !val?.stars) continue;
    out[day] = {
      monsterId: val.monsterId,
      stars: val.stars,
      result: val.result === "failure" ? "failure" : "success",
    };
  }
  return out;
}

function parseActiveQuest(raw: unknown): ActiveQuest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as ActiveQuest;
  if (!o.questId || !o.phase) return null;
  const lootProgress: Record<string, HunterLootProgress> = {};
  for (const [id, p] of Object.entries(o.lootProgress ?? {})) {
    lootProgress[id] = {
      ...p,
      brokenParts: p.brokenParts ?? [],
      lootQuantities: p.lootQuantities ?? {},
      confirmed: p.confirmed ?? false,
    };
  }
  return { ...o, lootProgress };
}

/** Migrate legacy shared stash from campaign_state onto first hunter. */
function migrateSharedStashToHunters(
  hunters: Hunter[],
  sharedMaterials: MaterialStash,
  sharedOwned: string[],
): Hunter[] {
  if (hunters.length === 0) return hunters;
  const hasAnyStash = hunters.some(
    (h) =>
      Object.keys(h.materials).length > 0 || h.ownedGear.length > 0,
  );
  if (hasAnyStash) return hunters;
  return hunters.map((h, i) =>
    i === 0
      ? {
          ...h,
          materials: { ...sharedMaterials, ...h.materials },
          ownedGear: [...new Set([...sharedOwned, ...h.ownedGear])],
        }
      : h,
  );
}

export function rowsToCampaign(
  campaign: CampaignRow,
  state: StateRow | null,
  hunters: HunterRow[],
): Campaign {
  const sortedHunters = hunters
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(rowToHunter);

  const migratedHunters = migrateSharedStashToHunters(
    sortedHunters,
    state?.materials ?? {},
    state?.owned_gear ?? [],
  );

  return {
    id: campaign.id,
    name: campaign.name,
    box: campaign.box,
    day: campaign.day,
    maxDay: campaign.max_day,
    leaderId: campaign.leader_hunter_id ?? migratedHunters[0]?.id ?? "",
    zenny: state?.zenny ?? 0,
    items: state?.items ?? {},
    questCompletions: parseQuestCompletions(state?.hunts_completed),
    activeQuest: parseActiveQuest(state?.active_quest),
    dayLog: parseDayLog(
      state?.day_log as Record<string, CalendarDayEntry> | null | undefined,
    ),
    hunters: migratedHunters,
    joinCode: campaign.join_code,
    createdAt: Date.parse(campaign.created_at) || Date.now(),
    updatedAt: Date.parse(campaign.updated_at) || Date.now(),
  };
}

export function rowToHunter(row: HunterRow): Hunter {
  return {
    id: row.id,
    name: row.name,
    palicoName: row.palico_name ?? undefined,
    playerName: row.player_name ?? undefined,
    userId: row.user_id ?? undefined,
    weaponType: row.weapon_type as WeaponType,
    equipped: (row.equipped ?? {}) as Partial<Record<GearSlot, string>>,
    materials: row.materials ?? {},
    ownedGear: row.owned_gear ?? [],
    notes: row.notes ?? undefined,
  };
}

export function campaignToStateUpdate(
  c: Campaign,
): Database["public"]["Tables"]["campaign_state"]["Update"] {
  return {
    zenny: c.zenny,
    items: c.items,
    hunts_completed: c.questCompletions,
    active_quest: c.activeQuest,
    day_log: c.dayLog,
  };
}

export function campaignToCampaignUpdate(
  c: Campaign,
): Database["public"]["Tables"]["campaign"]["Update"] {
  return {
    name: c.name,
    box: c.box,
    day: c.day,
    max_day: c.maxDay,
    leader_hunter_id: c.leaderId || null,
  };
}

export function hunterToInsert(
  campaignId: string,
  h: Hunter,
  userId?: string | null,
): Database["public"]["Tables"]["hunter"]["Insert"] {
  return {
    id: h.id,
    campaign_id: campaignId,
    user_id: userId ?? null,
    name: h.name,
    palico_name: h.palicoName ?? null,
    player_name: h.playerName ?? null,
    weapon_type: h.weaponType,
    equipped: h.equipped as Record<string, string>,
    materials: h.materials,
    owned_gear: h.ownedGear,
    notes: h.notes ?? null,
  };
}

export function hunterToUpdate(
  h: Hunter,
): Database["public"]["Tables"]["hunter"]["Update"] {
  return {
    name: h.name,
    palico_name: h.palicoName ?? null,
    player_name: h.playerName ?? null,
    weapon_type: h.weaponType,
    equipped: h.equipped as Record<string, string>,
    materials: h.materials,
    owned_gear: h.ownedGear,
    notes: h.notes ?? null,
  };
}
