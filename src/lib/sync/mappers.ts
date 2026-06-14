/**
 * Translate between the local `Campaign` shape (store) and the flat Supabase
 * rows (campaign + campaign_state + hunter[]). Kept pure and isolated so the
 * sync engine and tests can reason about one direction at a time.
 */
import type {
  ActiveDowntime,
  ActiveQuest,
  CalendarDayEntry,
  Campaign,
  GearSlot,
  Hunter,
  HunterLootProgress,
  MaterialStash,
  QuestStars,
  QuestDayReport,
  TradeRequest,
  WeaponType,
} from "../../domain/types";
import { normalizeCalendarDayEntry } from "../../domain/types";
import { migrateInvestigationLoot } from "../../domain/questRewards";
import { normalizeTradeRequest } from "../../domain/trade";
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

function parseRolledLoot(
  raw: unknown,
): Record<string, Record<string, number>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Record<string, number>> = {};
  for (const [hunterId, bucket] of Object.entries(raw as Record<string, unknown>)) {
    if (!bucket || typeof bucket !== "object") continue;
    const materials: Record<string, number> = {};
    for (const [id, qty] of Object.entries(bucket as Record<string, unknown>)) {
      if (typeof qty === "number" && qty > 0) materials[id] = qty;
    }
    if (Object.keys(materials).length > 0) out[hunterId] = materials;
  }
  return out;
}

function parseQuestDayReport(raw: unknown): QuestDayReport | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.questId !== "string") return undefined;
  return {
    questId: o.questId,
    investigationLoot: migrateInvestigationLoot(o.investigationLoot),
    rolledLoot: parseRolledLoot(o.rolledLoot),
    ...(o.keepInvestigationLoot === true
      ? { keepInvestigationLoot: true }
      : o.keepInvestigationLoot === false
        ? { keepInvestigationLoot: false }
        : {}),
  };
}

function parseDayLog(
  raw: Record<string, unknown> | null | undefined,
): Record<number, CalendarDayEntry> {
  const out: Record<number, CalendarDayEntry> = {};
  if (!raw) return out;
  for (const [key, val] of Object.entries(raw)) {
    const day = Number(key);
    if (!Number.isFinite(day) || day < 1 || !val || typeof val !== "object") {
      continue;
    }
    const o = val as Record<string, unknown>;
    if (o.kind === "downtime") {
      out[day] = { kind: "downtime" };
      continue;
    }
    if (
      typeof o.monsterId === "string" &&
      typeof o.stars === "string" &&
      (o.result === "success" || o.result === "failure")
    ) {
      const report = parseQuestDayReport(o.report);
      out[day] = normalizeCalendarDayEntry({
        kind: "quest",
        monsterId: o.monsterId,
        stars: o.stars as QuestStars,
        result: o.result,
        ...(o.handler ? { handler: true } : {}),
        ...(report ? { report } : {}),
      });
    }
  }
  return out;
}

function parsePendingTrades(raw: unknown): TradeRequest[] {
  if (!Array.isArray(raw)) return [];
  const trades: TradeRequest[] = [];
  for (const item of raw) {
    const trade = normalizeTradeRequest(item);
    if (trade) trades.push(trade);
  }
  return trades;
}

function parseActiveDowntime(raw: unknown): ActiveDowntime | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.picks !== "object" || o.picks === null || Array.isArray(o.picks)) {
    return null;
  }
  return {
    picks: o.picks as ActiveDowntime["picks"],
    provisions: (o.provisions as ActiveDowntime["provisions"]) ?? {},
    resourceRoll: (o.resourceRoll as ActiveDowntime["resourceRoll"]) ?? {},
    chefElement: (o.chefElement as ActiveDowntime["chefElement"]) ?? {},
    handlerProposals:
      (o.handlerProposals as ActiveDowntime["handlerProposals"]) ?? {},
    handlerQuestId:
      typeof o.handlerQuestId === "string" ? o.handlerQuestId : null,
    poogieDone: (o.poogieDone as ActiveDowntime["poogieDone"]) ?? {},
    confirmedHunterIds: Array.isArray(o.confirmedHunterIds)
      ? o.confirmedHunterIds
      : [],
  };
}

function normalizeLootChoice(
  choice: HunterLootProgress["choice"] | "split" | undefined,
): HunterLootProgress["choice"] | undefined {
  if (choice === "split") return "die1";
  if (choice === "die1" || choice === "die2" || choice === "sum") return choice;
  return undefined;
}

function parseActiveQuest(raw: unknown): ActiveQuest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as ActiveQuest;
  if (!o.questId || !o.phase) return null;
  const lootProgress: Record<string, HunterLootProgress> = {};
  for (const [id, p] of Object.entries(o.lootProgress ?? {})) {
    lootProgress[id] = {
      ...p,
      choice: normalizeLootChoice(p.choice),
      brokenParts: p.brokenParts ?? [],
      lootQuantities: p.lootQuantities ?? {},
      confirmed: p.confirmed ?? false,
    };
  }
  return {
    ...o,
    lootProgress,
    investigationLoot: migrateInvestigationLoot(
      o.investigationLoot,
      o.startedByHunterId,
    ),
    outcome: o.outcome,
    partyPotionsApplied: o.partyPotionsApplied ?? false,
  };
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
    dayLog: parseDayLog(state?.day_log as Record<string, unknown> | null | undefined),
    pendingHandlerQuestId: state?.pending_handler_quest ?? null,
    activeDowntime: parseActiveDowntime(state?.active_downtime),
    pendingTrades: parsePendingTrades(state?.pending_trades),
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
    playerName: row.player_name ?? undefined,
    userId: row.user_id ?? undefined,
    weaponType: row.weapon_type as WeaponType,
    equipped: (row.equipped ?? {}) as Partial<Record<GearSlot, string>>,
    materials: row.materials ?? {},
    ownedGear: row.owned_gear ?? [],
    elementResistance:
      (row.element_resistance as Hunter["elementResistance"]) ?? undefined,
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
    active_downtime: c.activeDowntime ?? null,
    pending_handler_quest: c.pendingHandlerQuestId ?? null,
    pending_trades: c.pendingTrades ?? [],
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
    player_name: h.playerName ?? null,
    weapon_type: h.weaponType,
    equipped: h.equipped as Record<string, string>,
    materials: h.materials,
    owned_gear: h.ownedGear,
    element_resistance: h.elementResistance ?? null,
    notes: h.notes ?? null,
  };
}

export function hunterToUpdate(
  h: Hunter,
): Database["public"]["Tables"]["hunter"]["Update"] {
  return {
    name: h.name,
    player_name: h.playerName ?? null,
    weapon_type: h.weaponType,
    equipped: h.equipped as Record<string, string>,
    materials: h.materials,
    owned_gear: h.ownedGear,
    element_resistance: h.elementResistance ?? null,
    notes: h.notes ?? null,
  };
}
