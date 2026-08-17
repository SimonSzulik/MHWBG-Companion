import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActiveQuest,
  Campaign,
  DowntimeActivityId,
  ElementType,
  ExpansionId,
  Hunter,
  HunterLootProgress,
  MonsterPartId,
  ProvisionsTrade,
  TradeRequest,
  WeaponType,
  GearSlot,
  MaterialStash,
} from "../domain/types";
import { normalizeCalendarDayEntry } from "../domain/types";
import { gameData } from "../data/gameData";
import {
  DEFAULT_BOXES,
  EXPANSION_BY_ID,
  WEAPON_EXPANSION,
  normalizeBoxes,
  primaryBoxLabel,
} from "../data/expansions";
import { questsForMonster } from "../data/quests";
import { clamp } from "../lib/math";
import {
  isRecraftableRoot,
  isStarterRoot,
  rootForgeUsage,
  catalog,
} from "../domain/catalog";
import {
  applyStarterKitToHunter,
  hunterNeedsStarterKit,
  starterKitFor,
} from "../domain/starterKit";
import {
  canIncrementQuestCompletion,
  canStartQuest,
  questById,
  shouldIncrementOnFailure,
} from "../domain/quests";
import { recordQuestOnCalendar, recordDowntimeOnCalendar } from "../domain/calendar";
import {
  applyInvestigationLoot,
  applyInvestigationLootToHunter,
  applyPartyPotionsOnce,
  aggregateInvestigationMaterials,
  buildQuestDayReport,
  hasAnyInvestigationLoot,
  hunterInvestigationLoot,
  migrateInvestigationLoot,
  mergeActiveQuest,
} from "../domain/questRewards";
import {
  MAX_DOWNTIME_PICKS,
  MAX_POTIONS,
  canTradeProvisions,
  applyDowntimeRewards,
  emptyActiveDowntime,
  handlerQuestPool,
  isHunterDowntimeReady,
  mergeActiveDowntime,
  resolveResourceRoll,
  syncHandlerQuestId,
} from "../domain/downtime";
import {
  applyTradeSwap,
  createTradeId,
  validateTradeProposal,
} from "../domain/trade";
import { seedLootQuantities, rollDice } from "../domain/loot";
import { lootTableForMonster } from "../data/lootTables";
import { useAuth } from "./auth";

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const MATERIAL_ID_MIGRATION: Record<string, string> = {
  "jagras-claw": "great-jagras-claw",
  "jagras-scale": "great-jagras-scale",
  "jagras-hide": "great-jagras-hide",
  "kadachi-fang": "tobi-kadachi-claw",
  "kadachi-pelt": "tobi-kadachi-pelt",
  "kadachi-claw": "tobi-kadachi-claw",
  "monster-bone-s": "monster-bone-small",
  "rath-ruby": "azure-rathalos-plate",
};

function migrateMaterials(materials: MaterialStash): MaterialStash {
  const next: MaterialStash = {};
  for (const [id, qty] of Object.entries(materials)) {
    const newId = MATERIAL_ID_MIGRATION[id] ?? id;
    next[newId] = (next[newId] ?? 0) + qty;
  }
  return next;
}

/** Legacy v4 campaign with shared stash on campaign level. */
type LegacyCampaignV4 = Omit<Campaign, "activeQuest"> & {
  activeQuest?: ActiveQuest | null;
  materials?: MaterialStash;
  ownedGear?: string[];
  leaderId?: string;
  questCompletions?: Record<string, number>;
  huntsCompleted?: Record<string, boolean>;
  hunters?: Array<
    Partial<Hunter> & {
      id: string;
      name: string;
      weaponType: WeaponType;
      equipped: Partial<Record<GearSlot, string>>;
    }
  >;
};

function emptyHunterStash(): MaterialStash {
  return {};
}

/**
 * Held-weapon stock for the consumption forge model. Preserve an existing stock
 * (it only lives client-side, never round-trips through Supabase) and otherwise
 * derive a sensible default: the hunter holds whatever weapon they have equipped.
 */
function deriveWeaponStock(
  existing: Record<string, number> | undefined,
  equipped: Partial<Record<GearSlot, string>>,
): Record<string, number> {
  if (existing && Object.keys(existing).length > 0) return { ...existing };
  return equipped.weapon ? { [equipped.weapon]: 1 } : {};
}

function normalizeHunter(h: LegacyCampaignV4["hunters"] extends (infer U)[] | undefined ? U : never, fallbackMaterials: MaterialStash, fallbackOwned: string[]): Hunter {
  const equipped = h.equipped ?? {};
  return {
    id: h.id,
    name: h.name,
    playerName: h.playerName,
    userId: h.userId,
    weaponType: h.weaponType,
    equipped,
    materials: migrateMaterials(h.materials ?? fallbackMaterials),
    ownedGear: h.ownedGear ?? [...fallbackOwned],
    weaponStock: deriveWeaponStock(h.weaponStock, equipped),
    elementResistance: h.elementResistance,
    notes: h.notes,
  };
}

function normalizeLootChoice(
  choice: HunterLootProgress["choice"] | "split" | undefined,
): HunterLootProgress["choice"] | undefined {
  if (choice === "split") return "die1";
  if (choice === "die1" || choice === "die2" || choice === "sum") return choice;
  return undefined;
}

function normalizeActiveQuest(aq: ActiveQuest | null | undefined): ActiveQuest | null {
  if (!aq) return null;
  const lootProgress: Record<string, HunterLootProgress> = {};
  for (const [id, p] of Object.entries(aq.lootProgress ?? {})) {
    lootProgress[id] = {
      ...p,
      choice: normalizeLootChoice(p.choice),
      brokenParts: p.brokenParts ?? [],
      lootQuantities: p.lootQuantities ?? {},
      confirmed: p.confirmed ?? false,
    };
  }
  return {
    ...aq,
    lootProgress,
    investigationLoot: migrateInvestigationLoot(
      aq.investigationLoot,
      aq.startedByHunterId,
    ),
    outcome: aq.outcome,
    partyPotionsApplied: aq.partyPotionsApplied ?? false,
  };
}

function migrateCampaign(raw: LegacyCampaignV4): Campaign {
  const questCompletions: Record<string, number> = {
    ...(raw.questCompletions ?? {}),
  };
  if (raw.huntsCompleted) {
    for (const [id, done] of Object.entries(raw.huntsCompleted)) {
      if (questCompletions[id] == null) {
        questCompletions[id] = done ? 1 : 0;
      }
    }
  }

  const sharedMaterials = migrateMaterials(raw.materials ?? {});
  const sharedOwned = raw.ownedGear ?? [];
  const hunters = (raw.hunters ?? []).map((h, i) =>
    normalizeHunter(
      h,
      i === 0 ? sharedMaterials : emptyHunterStash(),
      i === 0 ? sharedOwned : [],
    ),
  );

  const { huntsCompleted: _h, materials: _m, ownedGear: _o, ...rest } = raw;
  const dayLog: Campaign["dayLog"] = {};
  for (const [day, entry] of Object.entries(rest.dayLog ?? {})) {
    dayLog[Number(day)] = normalizeCalendarDayEntry(
      entry as Parameters<typeof normalizeCalendarDayEntry>[0],
    );
  }
  // Saves predating box selection had access to every box the app shipped, so
  // that is what they migrate to — defaulting them to Ancient Forest alone would
  // make an existing Wildspire stash or an Arsenal hunter vanish from the UI.
  const boxes = normalizeBoxes((rest as { boxes?: unknown }).boxes);

  return {
    ...rest,
    boxes,
    box: primaryBoxLabel(boxes),
    hunters,
    leaderId: rest.leaderId ?? hunters[0]?.id ?? "",
    questCompletions,
    activeQuest: normalizeActiveQuest(rest.activeQuest),
    dayLog,
    items: rest.items ?? {},
    zenny: rest.zenny ?? 0,
    pendingHandlerQuestId: rest.pendingHandlerQuestId ?? null,
    activeDowntime: rest.activeDowntime ?? null,
    pendingTrades: rest.pendingTrades ?? [],
  };
}

const PERSIST_KEY = "mhwbg-campaign-v5";
const LEGACY_KEYS = ["mhwbg-campaign-v4", "mhwbg-campaign-v3", "mhwbg-campaign-v2"];

const campaignStorage = createJSONStorage<CampaignState>(() => ({
  getItem: (name) => {
    const current = localStorage.getItem(name);
    if (current) {
      try {
        const parsed = JSON.parse(current) as {
          state?: { campaign?: LegacyCampaignV4 | null };
        };
        if (parsed.state?.campaign) {
          parsed.state.campaign = migrateCampaign(parsed.state.campaign);
          return JSON.stringify(parsed);
        }
      } catch {
        return current;
      }
      return current;
    }
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (!legacy) continue;
      try {
        const parsed = JSON.parse(legacy) as {
          state?: { campaign?: LegacyCampaignV4 | null };
        };
        if (parsed.state?.campaign) {
          parsed.state.campaign = migrateCampaign(parsed.state.campaign);
        }
        return JSON.stringify(parsed);
      } catch {
        continue;
      }
    }
    return null;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}));

interface StartCampaignInput {
  campaignName: string;
  name: string;
  weaponType: WeaponType;
  maxDay?: number;
  potions?: number;
  /** Boxes the group owns; defaults to the first core box. */
  boxes?: ExpansionId[];
}

interface CampaignState {
  campaign: Campaign | null;
  hydrated: boolean;

  startCampaign: (input: StartCampaignInput) => void;
  /** Change which boxes the group owns. Never deletes owned gear or materials. */
  setBoxes: (boxes: ExpansionId[]) => { ok: boolean; reason?: string };
  resetCampaign: () => void;

  addHunter: (input: {
    name: string;
    weaponType: WeaponType;
  }) => void;
  updateHunter: (id: string, patch: Partial<Hunter>) => void;
  removeHunter: (id: string) => void;
  equipGear: (hunterId: string, slot: GearSlot, gearId: string | null) => void;

  adjustMaterial: (hunterId: string, materialId: string, delta: number) => void;
  setMaterial: (hunterId: string, materialId: string, qty: number) => void;
  adjustItem: (itemId: string, delta: number) => void;

  craftGear: (hunterId: string, gearId: string) => { ok: boolean; reason?: string };

  setDay: (day: number) => void;
  incrementQuest: (questId: string) => void;

  applyRemoteCampaign: (campaign: Campaign) => void;
  applyStarterKit: (hunterId: string) => void;
  /** Always apply the kit for the hunter's weapon (e.g. after cloud join). */
  forceStarterKit: (hunterId: string) => void;

  startQuest: (questId: string, hunterId: string) => { ok: boolean; reason?: string };
  /** Replay an exhausted investigation/tempered quest via the Handler downtime. */
  startHandlerQuest: (
    questId: string,
    hunterId: string,
  ) => { ok: boolean; reason?: string };
  joinQuest: (hunterId: string) => { ok: boolean; reason?: string };
  leaveQuestLobby: (hunterId: string) => void;
  /** Dev/test: advance the lobby to investigation regardless of readiness. */
  forceStartQuest: () => void;
  setInvestigationLoot: (
    hunterId: string,
    materialId: string,
    qty: number,
  ) => { ok: boolean; reason?: string };
  finishInvestigation: (hunterId: string) => { ok: boolean; reason?: string };
  /** Abort during investigation; clears the active quest for everyone. */
  cancelQuest: (hunterId: string) => { ok: boolean; reason?: string };
  useQuestPotion: (hunterId: string) => { ok: boolean; reason?: string };
  completeQuestFailure: (keepInvestigationLoot?: boolean) => void;
  completeQuestSuccess: () => void;
  setLootDice: (hunterId: string, dice: [number, number]) => void;
  setLootChoice: (
    hunterId: string,
    choice: HunterLootProgress["choice"],
  ) => void;
  togglePartBreak: (hunterId: string, part: MonsterPartId) => void;
  setLootQuantity: (hunterId: string, materialId: string, qty: number) => void;
  confirmPersonalLoot: (hunterId: string) => void;
  confirmQuestSummary: () => void;

  beginDowntime: () => { ok: boolean; reason?: string };
  setDowntimePicks: (
    hunterId: string,
    picks: DowntimeActivityId[],
  ) => { ok: boolean; reason?: string };
  resolveProvisions: (
    hunterId: string,
    trade: ProvisionsTrade,
  ) => { ok: boolean; reason?: string };
  resolveResourceCenter: (
    hunterId: string,
    sum: number,
  ) => { ok: boolean; reason?: string };
  resolveChef: (
    hunterId: string,
    element: ElementType,
  ) => { ok: boolean; reason?: string };
  resolvePoogie: (hunterId: string) => { ok: boolean; reason?: string };
  setHandlerQuest: (
    hunterId: string,
    questId: string,
  ) => { ok: boolean; reason?: string };
  confirmDowntime: (hunterId: string) => { ok: boolean; reason?: string };
  cancelDowntime: () => void;

  proposeTrade: (
    fromHunterId: string,
    toHunterId: string,
    offered: Record<string, number>,
    requested: Record<string, number>,
  ) => { ok: boolean; reason?: string };
  acceptTrade: (tradeId: string, hunterId: string) => { ok: boolean; reason?: string };
  declineTrade: (tradeId: string, hunterId: string) => { ok: boolean; reason?: string };
  cancelTrade: (tradeId: string, hunterId: string) => { ok: boolean; reason?: string };
}

function backfillStarterKits(campaign: Campaign): Campaign {
  const hunters = campaign.hunters.map((h) =>
    hunterNeedsStarterKit(h) ? applyStarterKitToHunter(h) : h,
  );
  const changed = hunters.some((h, i) => h !== campaign.hunters[i]);
  return changed ? { ...campaign, hunters } : campaign;
}

function allHuntersReady(campaign: Campaign, aq: ActiveQuest): boolean {
  return campaign.hunters.every((h) => aq.readyHunterIds.includes(h.id));
}


function tryAdvanceToActive(campaign: Campaign): Campaign {
  const aq = campaign.activeQuest;
  if (!aq || aq.phase !== "lobby") return campaign;
  if (!allHuntersReady(campaign, aq)) return campaign;
  return touch({
    ...campaign,
    activeQuest: {
      ...aq,
      phase: "investigation",
      investigationLoot: aq.investigationLoot ?? {},
    },
  });
}

function emptyLootProgress(): HunterLootProgress {
  return { dice: [1, 1], brokenParts: [], lootQuantities: {}, confirmed: false };
}

function lootTableForActiveQuest(campaign: Campaign) {
  const questId = campaign.activeQuest?.questId;
  if (!questId) return null;
  const quest = questById(questId);
  if (!quest) return null;
  return lootTableForMonster(quest.monsterId);
}

function clearElementResistances(campaign: Campaign): Campaign {
  return {
    ...campaign,
    hunters: campaign.hunters.map((h) => {
      if (!h.elementResistance) return h;
      const { elementResistance: _, ...rest } = h;
      return rest;
    }),
  };
}

function patchLootProgress(
  campaign: Campaign,
  hunterId: string,
  patch: Partial<HunterLootProgress>,
): Campaign {
  const aq = campaign.activeQuest;
  if (!aq?.lootProgress[hunterId]) return campaign;

  const prev = aq.lootProgress[hunterId];
  const next: HunterLootProgress = { ...prev, ...patch };
  const table = lootTableForActiveQuest(campaign);

  if (table && next.choice) {
    next.lootQuantities = seedLootQuantities(
      table,
      next.dice,
      next.choice,
      next.brokenParts,
    );
  } else if (!next.choice) {
    next.lootQuantities = {};
  }

  return touch({
    ...campaign,
    activeQuest: {
      ...aq,
      lootProgress: { ...aq.lootProgress, [hunterId]: next },
    },
  });
}

export const useCampaign = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaign: null,
      hydrated: false,

      startCampaign: ({
        campaignName,
        name,
        weaponType,
        maxDay = 25,
        potions = 1,
        boxes = DEFAULT_BOXES,
      }) => {
        const kit = starterKitFor(weaponType);
        const newHunter: Hunter = {
          id: uid(),
          name: name || "Hunter",
          userId: useAuth.getState().userId ?? undefined,
          weaponType,
          equipped: kit.equipped,
          materials: {},
          ownedGear: [...kit.owned],
          weaponStock: kit.equipped.weapon ? { [kit.equipped.weapon]: 1 } : {},
        };
        const now = Date.now();
        set({
          campaign: {
            id: uid(),
            name: campaignName || "Neue Kampagne",
            boxes: [...boxes],
            box: primaryBoxLabel(boxes),
            day: 1,
            maxDay: Math.max(1, maxDay),
            leaderId: newHunter.id,
            hunters: [newHunter],
            zenny: 0,
            items: { potion: potions },
            questCompletions: {},
            activeQuest: null,
            dayLog: {},
            pendingTrades: [],
            createdAt: now,
            updatedAt: now,
          },
        });
      },

      setBoxes: (next) => {
        const campaign = get().campaign;
        if (!campaign) return { ok: false, reason: "No campaign." };
        if (campaign.activeQuest || campaign.activeDowntime) {
          return {
            ok: false,
            reason: "Finish the current quest or downtime day first.",
          };
        }

        const boxes = normalizeBoxes(next);
        const owned = new Set(boxes);

        // A hunter cannot be left holding a weapon the party no longer owns.
        const orphaned = campaign.hunters.filter((h) => {
          const from = WEAPON_EXPANSION.get(h.weaponType);
          return from != null && !owned.has(from);
        });
        if (orphaned.length > 0) {
          return {
            ok: false,
            reason: `${orphaned
              .map((h) => `${h.name} (${h.weaponType})`)
              .join(", ")} would lose their weapon.`,
          };
        }

        // Adding a box extends the campaign timer once, as the rulebook says
        // (Ancient Forest p.38: +20 days for Wildspire Waste). Removing one
        // never shortens it — days already played cannot be taken back.
        const added = boxes.filter((b) => !campaign.boxes.includes(b));
        const extraDays = added.reduce(
          (sum, id) => sum + (EXPANSION_BY_ID.get(id)?.addsDays ?? 0),
          0,
        );

        set({
          campaign: touch({
            ...campaign,
            boxes,
            box: primaryBoxLabel(boxes),
            maxDay: campaign.maxDay + extraDays,
          }),
        });
        return { ok: true };
      },

      resetCampaign: () => set({ campaign: null }),

      addHunter: (input) =>
        set((s) => {
          if (!s.campaign) return s;
          const kit = starterKitFor(input.weaponType);
          const h: Hunter = {
            id: uid(),
            name: input.name || "Hunter",
            userId: useAuth.getState().userId ?? undefined,
            weaponType: input.weaponType,
            equipped: kit.equipped,
            materials: {},
            ownedGear: [...kit.owned],
            weaponStock: kit.equipped.weapon ? { [kit.equipped.weapon]: 1 } : {},
          };
          return {
            campaign: touch({
              ...s.campaign,
              hunters: [...s.campaign.hunters, h],
            }),
          };
        }),

      updateHunter: (id, patch) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) =>
                h.id === id ? { ...h, ...patch } : h,
              ),
            }),
          };
        }),

      removeHunter: (id) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.filter((h) => h.id !== id),
            }),
          };
        }),

      equipGear: (hunterId, slot, gearId) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) => {
                if (h.id !== hunterId) return h;
                const equipped = { ...h.equipped };
                if (gearId) equipped[slot] = gearId;
                else delete equipped[slot];
                return { ...h, equipped };
              }),
            }),
          };
        }),

      adjustMaterial: (hunterId, materialId, delta) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) => {
                if (h.id !== hunterId) return h;
                const cur = h.materials[materialId] ?? 0;
                return {
                  ...h,
                  materials: {
                    ...h.materials,
                    [materialId]: Math.max(0, cur + delta),
                  },
                };
              }),
            }),
          };
        }),

      setMaterial: (hunterId, materialId, qty) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) => {
                if (h.id !== hunterId) return h;
                return {
                  ...h,
                  materials: {
                    ...h.materials,
                    [materialId]: Math.max(0, Math.floor(qty) || 0),
                  },
                };
              }),
            }),
          };
        }),

      adjustItem: (itemId, delta) =>
        set((s) => {
          if (!s.campaign) return s;
          const cur = s.campaign.items[itemId] ?? 0;
          let next = Math.max(0, cur + delta);
          if (itemId === "potion" && delta > 0) {
            next = Math.min(next, MAX_POTIONS);
          }
          return {
            campaign: touch({
              ...s.campaign,
              items: { ...s.campaign.items, [itemId]: next },
            }),
          };
        }),

      craftGear: (hunterId, gearId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const hunter = s.campaign.hunters.find((h) => h.id === hunterId);
        if (!hunter) return { ok: false, reason: "Hunter not found." };
        const def = gameData.gear.find((g) => g.id === gearId);
        if (!def) return { ok: false, reason: "Unknown gear." };

        const isWeapon = def.slot === "weapon";
        const order = def.pathOrder ?? 0;
        const recraftableRoot = isRecraftableRoot(def);

        // Re-craftable roots may be forged again (to open another path); every
        // other piece is one-and-done.
        if (hunter.ownedGear.includes(gearId) && !recraftableRoot)
          return { ok: false, reason: "Already forged." };

        // Weapon prerequisites: a tier consumes one held instance of its base.
        let prevId: string | undefined;
        if (isWeapon) {
          if (order === 0) {
            if (!recraftableRoot)
              return { ok: false, reason: "Starter weapon — provided." };
            const { used, cap } = rootForgeUsage(
              hunter,
              gearId,
              hunter.weaponType,
            );
            if (used >= cap)
              return {
                ok: false,
                reason: "All paths of this weapon are already unlocked.",
              };
          } else {
            const path = gameData.weaponPaths?.find((p) => p.id === def.pathId);
            prevId = path?.gearIds[order - 1];
            const prevDef = prevId ? catalog.gear(prevId) : undefined;
            const held = prevId ? (hunter.weaponStock?.[prevId] ?? 0) : 0;
            const starterBase = prevDef && isStarterRoot(prevDef);
            if (!prevId || (held < 1 && !starterBase))
              return { ok: false, reason: "Base weapon missing." };
          }
        }

        for (const c of def.cost) {
          if ((hunter.materials[c.materialId] ?? 0) < c.qty)
            return { ok: false, reason: "Materials missing." };
        }

        const materials = { ...hunter.materials };
        for (const c of def.cost) {
          materials[c.materialId] = (materials[c.materialId] ?? 0) - c.qty;
        }

        let weaponStock = hunter.weaponStock;
        let equipped = hunter.equipped;
        if (isWeapon) {
          const stock = { ...(hunter.weaponStock ?? {}) };
          if (prevId) {
            const prevDef = catalog.gear(prevId);
            if (!prevDef || !isStarterRoot(prevDef)) {
              const left = (stock[prevId] ?? 0) - 1;
              if (left > 0) stock[prevId] = left;
              else delete stock[prevId];
            }
          }
          stock[gearId] = (stock[gearId] ?? 0) + 1;
          weaponStock = stock;
          // Forging an upgrade replaces the weapon you were wielding.
          if (order > 0 && (hunter.equipped.weapon === prevId || !hunter.equipped.weapon)) {
            equipped = { ...hunter.equipped, weapon: gearId };
          }
        }

        const ownedGear = hunter.ownedGear.includes(gearId)
          ? hunter.ownedGear
          : [...hunter.ownedGear, gearId];

        set({
          campaign: touch({
            ...s.campaign,
            hunters: s.campaign.hunters.map((h) =>
              h.id === hunterId
                ? { ...h, materials, ownedGear, weaponStock, equipped }
                : h,
            ),
          }),
        });
        return { ok: true };
      },

      setDay: (day) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              day: clamp(Math.floor(day), 1, s.campaign.maxDay),
            }),
          };
        }),

      incrementQuest: (questId) =>
        set((s) => {
          if (!s.campaign) return s;
          const quest = questById(questId);
          if (!quest) return s;
          const cur = s.campaign.questCompletions[questId] ?? 0;
          if (!canIncrementQuestCompletion(quest, cur)) return s;
          return {
            campaign: touch({
              ...s.campaign,
              questCompletions: {
                ...s.campaign.questCompletions,
                [questId]: cur + 1,
              },
            }),
          };
        }),

      applyRemoteCampaign: (campaign) =>
        set((s) => {
          const migrated = backfillStarterKits(
            migrateCampaign(campaign as LegacyCampaignV4),
          );
          // weaponStock is client-only — keep ours so a remote pull (which has
          // no stock column) never resets in-progress forge consumption.
          const localById = new Map(
            (s.campaign?.hunters ?? []).map((h) => [h.id, h]),
          );
          const hunters = migrated.hunters.map((h) => {
            const localStock = localById.get(h.id)?.weaponStock;
            return localStock && Object.keys(localStock).length > 0
              ? { ...h, weaponStock: localStock }
              : h;
          });
          let next: Campaign = { ...migrated, hunters };
          const local = s.campaign;

          if (local?.id === next.id && local.activeDowntime) {
            if (!next.activeDowntime) {
              // Remote lost downtime on the same campaign day — keep local progress
              // unless the day already advanced (downtime finished elsewhere).
              if (next.day === local.day) {
                next = { ...next, activeDowntime: local.activeDowntime };
              }
            } else {
              next = {
                ...next,
                activeDowntime: mergeActiveDowntime(
                  local.activeDowntime,
                  next.activeDowntime,
                ),
              };
            }
          }

          if (
            local?.id === next.id &&
            local.activeQuest &&
            next.activeQuest &&
            local.activeQuest.questId === next.activeQuest.questId
          ) {
            next = {
              ...next,
              activeQuest: mergeActiveQuest(local.activeQuest, next.activeQuest),
            };
            next = tryAdvanceToActive(next);
          }

          return { campaign: next };
        }),

      applyStarterKit: (hunterId) =>
        set((s) => {
          if (!s.campaign) return s;
          const hunter = s.campaign.hunters.find((h) => h.id === hunterId);
          if (!hunter || !hunterNeedsStarterKit(hunter)) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) =>
                h.id === hunterId ? applyStarterKitToHunter(h) : h,
              ),
            }),
          };
        }),

      forceStarterKit: (hunterId) =>
        set((s) => {
          if (!s.campaign) return s;
          const hunter = s.campaign.hunters.find((h) => h.id === hunterId);
          if (!hunter) return s;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: s.campaign.hunters.map((h) =>
                h.id === hunterId ? applyStarterKitToHunter(h) : h,
              ),
            }),
          };
        }),

      startQuest: (questId, hunterId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const quest = questById(questId);
        if (!quest) return { ok: false, reason: "Unknown quest." };
        if (s.campaign.activeQuest) {
          return { ok: false, reason: "A quest is already in progress." };
        }
        if (s.campaign.activeDowntime) {
          return {
            ok: false,
            reason: "Finish downtime before starting a quest.",
          };
        }
        const pending = s.campaign.pendingHandlerQuestId;
        if (pending && pending !== questId) {
          return {
            ok: false,
            reason: "Complete the Handler quest first.",
          };
        }
        const isHandler = pending === questId;
        if (
          !isHandler &&
          !canStartQuest(
            quest,
            s.campaign.questCompletions,
            false,
            questsForMonster(quest.monsterId),
            pending,
          )
        ) {
          return { ok: false, reason: "Quest unavailable." };
        }
        const activeQuest: ActiveQuest = {
          questId,
          phase: "lobby",
          readyHunterIds: [hunterId],
          startedByHunterId: hunterId,
          lootProgress: {},
          investigationLoot: {},
          ...(isHandler ? { handler: true } : {}),
        };
        set({
          campaign: tryAdvanceToActive(
            touch({
              ...s.campaign,
              activeQuest,
              pendingHandlerQuestId: isHandler
                ? null
                : s.campaign.pendingHandlerQuestId,
            }),
          ),
        });
        return { ok: true };
      },

      startHandlerQuest: (questId, hunterId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const quest = questById(questId);
        if (!quest) return { ok: false, reason: "Unknown quest." };
        if (s.campaign.activeQuest) {
          return { ok: false, reason: "A quest is already in progress." };
        }
        // Only exhausted (4×) investigation/tempered quests can be replayed.
        const pool = handlerQuestPool(s.campaign.questCompletions);
        if (!pool.some((q) => q.id === questId)) {
          return { ok: false, reason: "Quest not available for the Handler." };
        }
        const activeQuest: ActiveQuest = {
          questId,
          phase: "lobby",
          readyHunterIds: [hunterId],
          startedByHunterId: hunterId,
          lootProgress: {},
          investigationLoot: {},
          handler: true,
        };
        // Starting the replay takes over the downtime day.
        set({
          campaign: tryAdvanceToActive(
            touch({
              ...s.campaign,
              activeQuest,
              activeDowntime: null,
              pendingHandlerQuestId: null,
            }),
          ),
        });
        return { ok: true };
      },

      joinQuest: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "No active quest." };
        }
        if (s.campaign.activeDowntime) {
          return {
            ok: false,
            reason: "Finish downtime before joining a quest.",
          };
        }
        const aq = s.campaign.activeQuest;
        if (aq.readyHunterIds.includes(hunterId)) {
          return { ok: true };
        }
        if (aq.phase === "investigation") {
          const next: ActiveQuest = {
            ...aq,
            readyHunterIds: [...aq.readyHunterIds, hunterId],
          };
          set({
            campaign: touch({ ...s.campaign, activeQuest: next }),
          });
          return { ok: true };
        }
        if (aq.phase !== "lobby") {
          return { ok: false, reason: "Quest already started." };
        }
        const next: ActiveQuest = {
          ...aq,
          readyHunterIds: [...aq.readyHunterIds, hunterId],
        };
        set({
          campaign: tryAdvanceToActive(
            touch({ ...s.campaign, activeQuest: next }),
          ),
        });
        return { ok: true };
      },

      leaveQuestLobby: (hunterId) =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const aq = s.campaign.activeQuest;
          if (aq.phase !== "lobby") return s;
          const readyHunterIds = aq.readyHunterIds.filter((id) => id !== hunterId);
          if (readyHunterIds.length === 0) {
            return { campaign: touch({ ...s.campaign, activeQuest: null }) };
          }
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: { ...aq, readyHunterIds },
            }),
          };
        }),

      forceStartQuest: () =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const aq = s.campaign.activeQuest;
          if (aq.phase !== "lobby") return s;
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...aq,
                phase: "investigation",
                investigationLoot: aq.investigationLoot ?? {},
              },
            }),
          };
        }),

      setInvestigationLoot: (hunterId, materialId, qty) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "No active quest." };
        }
        const aq = s.campaign.activeQuest;
        if (aq.phase !== "investigation") {
          return { ok: false, reason: "Not in investigation phase." };
        }
        if (!s.campaign.hunters.some((h) => h.id === hunterId)) {
          return { ok: false, reason: "Hunter not found." };
        }
        if (materialId !== "potion" && !catalog.material(materialId)) {
          return { ok: false, reason: "Invalid material." };
        }
        const perHunter = { ...aq.investigationLoot };
        const mine = { ...(perHunter[hunterId] ?? {}) };
        if (qty <= 0) delete mine[materialId];
        else mine[materialId] = qty;
        if (Object.keys(mine).length === 0) delete perHunter[hunterId];
        else perHunter[hunterId] = mine;
        set({
          campaign: touch({
            ...s.campaign,
            activeQuest: { ...aq, investigationLoot: perHunter },
          }),
        });
        return { ok: true };
      },

      cancelQuest: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "No active quest." };
        }
        const aq = s.campaign.activeQuest;
        if (aq.phase !== "investigation") {
          return {
            ok: false,
            reason: "Quest can only be cancelled during investigation.",
          };
        }
        if (hunterId !== aq.startedByHunterId) {
          return { ok: false, reason: "Only the quest starter can cancel." };
        }
        set({
          campaign: touch({ ...s.campaign, activeQuest: null }),
        });
        return { ok: true };
      },

      useQuestPotion: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "No active quest." };
        }
        const aq = s.campaign.activeQuest;
        if (aq.phase !== "active") {
          return { ok: false, reason: "Potions can only be used during the hunt." };
        }
        const invQty =
          hunterInvestigationLoot(aq.investigationLoot, hunterId).potion ?? 0;
        if (invQty > 0) {
          const perHunter = { ...aq.investigationLoot };
          const mine = { ...(perHunter[hunterId] ?? {}) };
          if (invQty <= 1) delete mine.potion;
          else mine.potion = invQty - 1;
          if (Object.keys(mine).length === 0) delete perHunter[hunterId];
          else perHunter[hunterId] = mine;
          set({
            campaign: touch({
              ...s.campaign,
              activeQuest: { ...aq, investigationLoot: perHunter },
            }),
          });
          return { ok: true };
        }
        const partyPotions = s.campaign.items.potion ?? 0;
        if (partyPotions <= 0) {
          return { ok: false, reason: "No potions available." };
        }
        set({
          campaign: touch({
            ...s.campaign,
            items: {
              ...s.campaign.items,
              potion: partyPotions - 1,
            },
          }),
        });
        return { ok: true };
      },

      finishInvestigation: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "No active quest." };
        }
        const aq = s.campaign.activeQuest;
        if (aq.phase !== "investigation") {
          return { ok: false, reason: "Not in investigation phase." };
        }
        if (hunterId !== aq.startedByHunterId) {
          return { ok: false, reason: "Only the quest starter can finish investigating." };
        }
        set({
          campaign: touch({
            ...s.campaign,
            activeQuest: { ...aq, phase: "active" },
          }),
        });
        return { ok: true };
      },

      completeQuestFailure: (keepInvestigationLoot) =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const aq = s.campaign.activeQuest;
          if (aq.phase !== "active") return s;
          const quest = questById(aq.questId);
          if (!quest) return s;
          if (
            quest.stars === "one-star" &&
            keepInvestigationLoot === undefined
          ) {
            return s;
          }
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...aq,
                phase: "summary",
                outcome: {
                  result: "failure",
                  keepInvestigationLoot:
                    quest.stars === "one-star"
                      ? keepInvestigationLoot
                      : false,
                },
              },
            }),
          };
        }),

      completeQuestSuccess: () =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const lootProgress: Record<string, HunterLootProgress> = {};
          for (const h of s.campaign.hunters) {
            lootProgress[h.id] = { ...emptyLootProgress(), dice: rollDice() };
          }
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...s.campaign.activeQuest,
                phase: "looting",
                lootProgress,
              },
            }),
          };
        }),

      setLootDice: (hunterId, dice) =>
        set((s) => {
          if (!s.campaign?.activeQuest?.lootProgress[hunterId]) return s;
          return {
            campaign: patchLootProgress(s.campaign, hunterId, {
              dice,
              choice: undefined,
            }),
          };
        }),

      setLootChoice: (hunterId, choice) =>
        set((s) => {
          if (!s.campaign?.activeQuest?.lootProgress[hunterId]) return s;
          return { campaign: patchLootProgress(s.campaign, hunterId, { choice }) };
        }),

      togglePartBreak: (hunterId, part) =>
        set((s) => {
          if (!s.campaign?.activeQuest?.lootProgress[hunterId]) return s;
          const progress = s.campaign.activeQuest.lootProgress[hunterId];
          const has = progress.brokenParts.includes(part);
          const brokenParts = has
            ? progress.brokenParts.filter((p) => p !== part)
            : [...progress.brokenParts, part];
          return {
            campaign: patchLootProgress(s.campaign, hunterId, { brokenParts }),
          };
        }),

      setLootQuantity: (hunterId, materialId, qty) =>
        set((s) => {
          if (!s.campaign?.activeQuest?.lootProgress[hunterId]) return s;
          const progress = s.campaign.activeQuest.lootProgress[hunterId];
          const lootQuantities = { ...progress.lootQuantities };
          if (qty <= 0) delete lootQuantities[materialId];
          else lootQuantities[materialId] = qty;
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...s.campaign.activeQuest,
                lootProgress: {
                  ...s.campaign.activeQuest.lootProgress,
                  [hunterId]: { ...progress, lootQuantities },
                },
              },
            }),
          };
        }),

      confirmPersonalLoot: (hunterId) =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const aq = s.campaign.activeQuest;
          if (aq.phase !== "looting") return s;
          const progress = aq.lootProgress[hunterId];
          if (!progress?.choice || progress.confirmed) return s;

          let campaign = applyInvestigationLootToHunter(
            s.campaign,
            hunterId,
            aggregateInvestigationMaterials(aq.investigationLoot),
          );
          campaign = {
            ...campaign,
            hunters: campaign.hunters.map((h) =>
              h.id === hunterId
                ? {
                    ...h,
                    materials: (() => {
                      const materials = { ...h.materials };
                      for (const [id, qty] of Object.entries(
                        progress.lootQuantities,
                      )) {
                        if (qty <= 0) continue;
                        materials[id] = (materials[id] ?? 0) + qty;
                      }
                      return materials;
                    })(),
                  }
                : h,
            ),
          };

          const potionResult = applyPartyPotionsOnce(
            campaign,
            aq.investigationLoot ?? {},
            aq.partyPotionsApplied ?? false,
          );
          campaign = potionResult.campaign;

          const nextAq: ActiveQuest = {
            ...aq,
            partyPotionsApplied:
              aq.partyPotionsApplied || potionResult.applied,
            lootProgress: {
              ...aq.lootProgress,
              [hunterId]: { ...progress, confirmed: true },
            },
          };
          campaign = touch({ ...campaign, activeQuest: nextAq });

          const allConfirmed = campaign.hunters.every(
            (h) => campaign.activeQuest?.lootProgress[h.id]?.confirmed,
          );

          if (allConfirmed) {
            const quest = questById(aq.questId);
            if (quest) {
              const report = buildQuestDayReport(aq);
              const cur = campaign.questCompletions[aq.questId] ?? 0;
              campaign = clearElementResistances(
                touch({
                  ...campaign,
                  questCompletions: canIncrementQuestCompletion(quest, cur)
                    ? {
                        ...campaign.questCompletions,
                        [aq.questId]: cur + 1,
                      }
                    : campaign.questCompletions,
                  activeQuest: null,
                }),
              );
              campaign = touch(
                recordQuestOnCalendar(campaign, quest, "success", aq.handler, {
                  report,
                }),
              );
            }
          }

          return { campaign };
        }),

      confirmQuestSummary: () =>
        set((s) => {
          if (!s.campaign?.activeQuest?.outcome) return s;
          const aq = s.campaign.activeQuest;
          const outcome = aq.outcome;
          const quest = questById(aq.questId);
          if (!quest || !outcome || outcome.result !== "failure") return s;

          const { keepInvestigationLoot } = outcome;
          let campaign = s.campaign;

          if (
            keepInvestigationLoot === true &&
            hasAnyInvestigationLoot(aq.investigationLoot)
          ) {
            campaign = touch(
              applyInvestigationLoot(campaign, aq.investigationLoot),
            );
          }

          let questCompletions = campaign.questCompletions;
          if (shouldIncrementOnFailure(quest)) {
            const cur = questCompletions[aq.questId] ?? 0;
            if (canIncrementQuestCompletion(quest, cur)) {
              questCompletions = {
                ...questCompletions,
                [aq.questId]: cur + 1,
              };
            }
          }

          campaign = clearElementResistances(
            touch({
              ...campaign,
              questCompletions,
              activeQuest: null,
            }),
          );

          campaign = touch(
            recordQuestOnCalendar(campaign, quest, "failure", aq.handler, {
              keepInvestigationLoot,
              report: buildQuestDayReport(aq),
            }),
          );

          return { campaign };
        }),

      beginDowntime: () => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        if (s.campaign.activeQuest) {
          return { ok: false, reason: "Cannot start downtime during a quest." };
        }
        if (s.campaign.activeDowntime) {
          return { ok: true };
        }
        set({
          campaign: touch({
            ...s.campaign,
            activeDowntime: emptyActiveDowntime(),
          }),
        });
        return { ok: true };
      },

      setDowntimePicks: (hunterId, picks) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        if (picks.length > MAX_DOWNTIME_PICKS) {
          return {
            ok: false,
            reason: `Choose at most ${MAX_DOWNTIME_PICKS} activities.`,
          };
        }
        const unique = new Set(picks);
        if (unique.size !== picks.length) {
          return { ok: false, reason: "Each activity can only be chosen once." };
        }
        const dt = {
          ...s.campaign.activeDowntime,
          picks: { ...s.campaign.activeDowntime.picks, [hunterId]: picks },
        };
        set({
          campaign: touch({ ...s.campaign, activeDowntime: dt }),
        });
        return { ok: true };
      },

      resolveProvisions: (hunterId, trade) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const hunter = s.campaign.hunters.find((h) => h.id === hunterId);
        if (!hunter) return { ok: false, reason: "Hunter not found." };
        const picks = s.campaign.activeDowntime.picks[hunterId] ?? [];
        if (!picks.includes("provisions")) {
          return { ok: false, reason: "Provisions Stockpile not selected." };
        }
        const potions = s.campaign.items.potion ?? 0;
        const err = canTradeProvisions(hunter, trade, potions);
        if (err) return { ok: false, reason: err };

        const dt = {
          ...s.campaign.activeDowntime,
          provisions: {
            ...s.campaign.activeDowntime.provisions,
            [hunterId]: trade,
          },
        };

        set({
          campaign: touch({
            ...s.campaign,
            activeDowntime: dt,
          }),
        });
        return { ok: true };
      },

      resolveResourceCenter: (hunterId, sum) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const materialId = resolveResourceRoll(sum);
        if (!materialId) {
          return { ok: false, reason: "Dice total must be 2–12." };
        }

        const dt = {
          ...s.campaign.activeDowntime,
          resourceRoll: {
            ...s.campaign.activeDowntime.resourceRoll,
            [hunterId]: sum,
          },
        };

        set({
          campaign: touch({
            ...s.campaign,
            activeDowntime: dt,
          }),
        });
        return { ok: true };
      },

      resolveChef: (hunterId, element) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const dt = {
          ...s.campaign.activeDowntime,
          chefElement: {
            ...s.campaign.activeDowntime.chefElement,
            [hunterId]: element,
          },
        };
        set({
          campaign: touch({ ...s.campaign, activeDowntime: dt }),
        });
        return { ok: true };
      },

      resolvePoogie: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const picks = s.campaign.activeDowntime.picks[hunterId] ?? [];
        if (!picks.includes("poogie")) {
          return { ok: false, reason: "Pet Poogie not selected." };
        }
        const dt = {
          ...s.campaign.activeDowntime,
          poogieDone: {
            ...s.campaign.activeDowntime.poogieDone,
            [hunterId]: true,
          },
        };
        set({
          campaign: touch({ ...s.campaign, activeDowntime: dt }),
        });
        return { ok: true };
      },

      setHandlerQuest: (hunterId, questId) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const hunterIds = s.campaign.hunters.map((h) => h.id);
        const dt = syncHandlerQuestId(
          {
            ...s.campaign.activeDowntime,
            handlerProposals: {
              ...s.campaign.activeDowntime.handlerProposals,
              [hunterId]: questId,
            },
          },
          hunterIds,
        );
        set({
          campaign: touch({ ...s.campaign, activeDowntime: dt }),
        });
        return { ok: true };
      },

      confirmDowntime: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeDowntime) {
          return { ok: false, reason: "Downtime not started." };
        }
        const dt = s.campaign.activeDowntime;
        const hunterIds = s.campaign.hunters.map((h) => h.id);
        if (!isHunterDowntimeReady(hunterId, dt, hunterIds)) {
          return { ok: false, reason: "Complete all chosen activities first." };
        }
        if (dt.confirmedHunterIds.includes(hunterId)) {
          return { ok: true };
        }

        const confirmedHunterIds = [...dt.confirmedHunterIds, hunterId];
        let campaign = touch({
          ...s.campaign,
          activeDowntime: { ...dt, confirmedHunterIds },
        });

        const allConfirmed = hunterIds.every((id) =>
          confirmedHunterIds.includes(id),
        );

        if (allConfirmed) {
          campaign = touch(applyDowntimeRewards(campaign));
          campaign = touch(recordDowntimeOnCalendar(campaign));
          campaign = touch({
            ...campaign,
            pendingHandlerQuestId: dt.handlerQuestId,
            activeDowntime: null,
          });
        }

        set({ campaign });
        return { ok: true };
      },

      cancelDowntime: () =>
        set((s) => {
          if (!s.campaign?.activeDowntime) return s;
          return {
            campaign: touch({ ...s.campaign, activeDowntime: null }),
          };
        }),

      proposeTrade: (fromHunterId, toHunterId, offered, requested) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const err = validateTradeProposal(
          s.campaign,
          fromHunterId,
          toHunterId,
          offered,
          requested,
        );
        if (err) return { ok: false, reason: err };
        const trade: TradeRequest = {
          id: createTradeId(),
          fromHunterId,
          toHunterId,
          offered: Object.fromEntries(
            Object.entries(offered).filter(([, qty]) => qty > 0),
          ),
          requested: Object.fromEntries(
            Object.entries(requested).filter(([, qty]) => qty > 0),
          ),
          status: "pending",
        };
        set({
          campaign: touch({
            ...s.campaign,
            pendingTrades: [...(s.campaign.pendingTrades ?? []), trade],
          }),
        });
        return { ok: true };
      },

      acceptTrade: (tradeId, hunterId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const trades = s.campaign.pendingTrades ?? [];
        const trade = trades.find((t) => t.id === tradeId);
        if (!trade || trade.status !== "pending") {
          return { ok: false, reason: "Trade not found." };
        }
        if (trade.toHunterId !== hunterId) {
          return { ok: false, reason: "Not your trade to accept." };
        }
        const err = validateTradeProposal(
          s.campaign,
          trade.fromHunterId,
          trade.toHunterId,
          trade.offered,
          trade.requested,
          { skipPendingCheck: true },
        );
        if (err) return { ok: false, reason: err };
        const hunters = applyTradeSwap(s.campaign.hunters, trade);
        set({
          campaign: touch({
            ...s.campaign,
            hunters,
            pendingTrades: trades.filter((t) => t.id !== tradeId),
          }),
        });
        return { ok: true };
      },

      declineTrade: (tradeId, hunterId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const trade = (s.campaign.pendingTrades ?? []).find((t) => t.id === tradeId);
        if (!trade || trade.toHunterId !== hunterId) {
          return { ok: false, reason: "Trade not found." };
        }
        set({
          campaign: touch({
            ...s.campaign,
            pendingTrades: (s.campaign.pendingTrades ?? []).map((t) =>
              t.id === tradeId ? { ...t, status: "declined" as const } : t,
            ).filter((t) => t.status === "pending"),
          }),
        });
        return { ok: true };
      },

      cancelTrade: (tradeId, hunterId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "No campaign." };
        const trade = (s.campaign.pendingTrades ?? []).find((t) => t.id === tradeId);
        if (!trade || trade.fromHunterId !== hunterId) {
          return { ok: false, reason: "Trade not found." };
        }
        set({
          campaign: touch({
            ...s.campaign,
            pendingTrades: (s.campaign.pendingTrades ?? []).filter(
              (t) => t.id !== tradeId,
            ),
          }),
        });
        return { ok: true };
      },
    }),
    {
      name: PERSIST_KEY,
      storage: campaignStorage,
    },
  ),
);

useCampaign.persist.onFinishHydration(() => {
  useCampaign.setState({ hydrated: true });
});
if (useCampaign.persist.hasHydrated()) {
  useCampaign.setState({ hydrated: true });
}

function touch(c: Campaign): Campaign {
  return { ...c, updatedAt: Date.now() };
}
