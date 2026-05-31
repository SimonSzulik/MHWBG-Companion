/**
 * Translate between the local `Campaign` shape (store) and the flat Supabase
 * rows (campaign + campaign_state + hunter[]). Kept pure and isolated so the
 * sync engine and tests can reason about one direction at a time.
 */
import type { Campaign, GearSlot, Hunter, WeaponType } from "../../domain/types";
import type { Database } from "../database.types";

type CampaignRow = Database["public"]["Tables"]["campaign"]["Row"];
type StateRow = Database["public"]["Tables"]["campaign_state"]["Row"];
type HunterRow = Database["public"]["Tables"]["hunter"]["Row"];

/** Parse hunts_completed jsonb (legacy bool or numeric counts). */
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

/** Build the local Campaign from the three remote pieces. */
export function rowsToCampaign(
  campaign: CampaignRow,
  state: StateRow | null,
  hunters: HunterRow[],
): Campaign {
  const sortedHunters = hunters
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(rowToHunter);

  return {
    id: campaign.id,
    name: campaign.name,
    box: campaign.box,
    day: campaign.day,
    maxDay: campaign.max_day,
    leaderId: campaign.leader_hunter_id ?? sortedHunters[0]?.id ?? "",
    zenny: state?.zenny ?? 0,
    materials: state?.materials ?? {},
    items: state?.items ?? {},
    ownedGear: state?.owned_gear ?? [],
    questCompletions: parseQuestCompletions(state?.hunts_completed),
    hunters: sortedHunters,
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
    weaponType: row.weapon_type as WeaponType,
    equipped: (row.equipped ?? {}) as Partial<Record<GearSlot, string>>,
    notes: row.notes ?? undefined,
  };
}

/** The mutable save fields that live in campaign_state. */
export function campaignToStateUpdate(
  c: Campaign,
): Database["public"]["Tables"]["campaign_state"]["Update"] {
  return {
    zenny: c.zenny,
    materials: c.materials,
    items: c.items,
    owned_gear: c.ownedGear,
    hunts_completed: c.questCompletions,
  };
}

/** Campaign-level scalar fields (name/day) that live on the campaign row. */
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
): Database["public"]["Tables"]["hunter"]["Insert"] {
  return {
    id: h.id,
    campaign_id: campaignId,
    name: h.name,
    palico_name: h.palicoName ?? null,
    player_name: h.playerName ?? null,
    weapon_type: h.weaponType,
    equipped: h.equipped as Record<string, string>,
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
    notes: h.notes ?? null,
  };
}
