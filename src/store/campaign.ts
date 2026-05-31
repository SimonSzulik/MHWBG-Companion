import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActiveQuest,
  Campaign,
  Hunter,
  HunterLootProgress,
  MonsterPartId,
  WeaponType,
  GearSlot,
  MaterialStash,
} from "../domain/types";
import { gameData } from "../data/gameData";
import { canCraftGear } from "../domain/catalog";
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
import { resolveLootChoice, rollDice } from "../domain/loot";
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

function normalizeHunter(h: LegacyCampaignV4["hunters"] extends (infer U)[] | undefined ? U : never, fallbackMaterials: MaterialStash, fallbackOwned: string[]): Hunter {
  return {
    id: h.id,
    name: h.name,
    palicoName: h.palicoName,
    playerName: h.playerName,
    userId: h.userId,
    weaponType: h.weaponType,
    equipped: h.equipped ?? {},
    materials: migrateMaterials(h.materials ?? fallbackMaterials),
    ownedGear: h.ownedGear ?? [...fallbackOwned],
    notes: h.notes,
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
  return {
    ...rest,
    hunters,
    leaderId: rest.leaderId ?? hunters[0]?.id ?? "",
    questCompletions,
    activeQuest: rest.activeQuest ?? null,
    items: rest.items ?? {},
    zenny: rest.zenny ?? 0,
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
  palicoName?: string;
  maxDay?: number;
  potions?: number;
}

interface CampaignState {
  campaign: Campaign | null;
  hydrated: boolean;

  startCampaign: (input: StartCampaignInput) => void;
  resetCampaign: () => void;

  addHunter: (input: {
    name: string;
    weaponType: WeaponType;
    palicoName?: string;
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
  joinQuest: (hunterId: string) => { ok: boolean; reason?: string };
  leaveQuestLobby: (hunterId: string) => void;
  completeQuestFailure: () => void;
  completeQuestSuccess: () => void;
  setLootDice: (hunterId: string, dice: [number, number]) => void;
  setLootChoice: (hunterId: string, choice: "split" | "sum") => void;
  togglePartBreak: (hunterId: string, part: MonsterPartId) => void;
  confirmLoot: (hunterId: string) => void;
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
    activeQuest: { ...aq, phase: "active" },
  });
}

function emptyLootProgress(): HunterLootProgress {
  return { dice: [1, 1], brokenParts: [], confirmed: false };
}

function applyLootToHunter(hunter: Hunter, rewards: Record<string, number>): Hunter {
  const materials = { ...hunter.materials };
  for (const [id, qty] of Object.entries(rewards)) {
    materials[id] = (materials[id] ?? 0) + qty;
  }
  return { ...hunter, materials };
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
        palicoName,
        maxDay = 25,
        potions = 1,
      }) => {
        const kit = starterKitFor(weaponType);
        const newHunter: Hunter = {
          id: uid(),
          name: name || "Hunter",
          palicoName,
          userId: useAuth.getState().userId ?? undefined,
          weaponType,
          equipped: kit.equipped,
          materials: {},
          ownedGear: [...kit.owned],
        };
        const now = Date.now();
        set({
          campaign: {
            id: uid(),
            name: campaignName || "Neue Kampagne",
            box: gameData.box,
            day: 1,
            maxDay: Math.max(1, maxDay),
            leaderId: newHunter.id,
            hunters: [newHunter],
            zenny: 0,
            items: { potion: potions },
            questCompletions: {},
            activeQuest: null,
            createdAt: now,
            updatedAt: now,
          },
        });
      },

      resetCampaign: () => set({ campaign: null }),

      addHunter: (input) =>
        set((s) => {
          if (!s.campaign) return s;
          const kit = starterKitFor(input.weaponType);
          const h: Hunter = {
            id: uid(),
            name: input.name || "Hunter",
            palicoName: input.palicoName,
            userId: useAuth.getState().userId ?? undefined,
            weaponType: input.weaponType,
            equipped: kit.equipped,
            materials: {},
            ownedGear: [...kit.owned],
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

      adjustItem: (itemId, delta) => {
        set((s) => {
          if (!s.campaign) return s;
          const cur = s.campaign.items[itemId] ?? 0;
          const next = Math.max(0, cur + delta);
          return {
            campaign: touch({
              ...s.campaign,
              items: { ...s.campaign.items, [itemId]: next },
            }),
          };
        });
        void import("../lib/sync/engine").then((m) => m.requestImmediatePush());
      },

      craftGear: (hunterId, gearId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "Keine Kampagne." };
        const hunter = s.campaign.hunters.find((h) => h.id === hunterId);
        if (!hunter) return { ok: false, reason: "Jäger nicht gefunden." };
        const def = gameData.gear.find((g) => g.id === gearId);
        if (!def) return { ok: false, reason: "Unbekanntes Gear." };
        if (hunter.ownedGear.includes(gearId))
          return { ok: false, reason: "Bereits gebaut." };
        if (!canCraftGear(def, hunter))
          return { ok: false, reason: "Voraussetzungen nicht erfüllt." };

        for (const c of def.cost) {
          if ((hunter.materials[c.materialId] ?? 0) < c.qty)
            return { ok: false, reason: "Material fehlt." };
        }

        const materials = { ...hunter.materials };
        for (const c of def.cost) {
          materials[c.materialId] = (materials[c.materialId] ?? 0) - c.qty;
        }
        set({
          campaign: touch({
            ...s.campaign,
            hunters: s.campaign.hunters.map((h) =>
              h.id === hunterId
                ? {
                    ...h,
                    materials,
                    ownedGear: [...h.ownedGear, gearId],
                  }
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
              day: Math.max(1, Math.min(s.campaign.maxDay, Math.floor(day))),
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
        set({
          campaign: backfillStarterKits(
            migrateCampaign(campaign as LegacyCampaignV4),
          ),
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
        if (!s.campaign) return { ok: false, reason: "Keine Kampagne." };
        const quest = questById(questId);
        if (!quest) return { ok: false, reason: "Quest unbekannt." };
        if (
          !canStartQuest(
            quest,
            s.campaign.questCompletions,
            s.campaign.activeQuest != null,
          )
        ) {
          return { ok: false, reason: "Quest nicht verfügbar." };
        }
        if (s.campaign.activeQuest) {
          return { ok: false, reason: "Es läuft bereits eine Quest." };
        }
        const activeQuest: ActiveQuest = {
          questId,
          phase: "lobby",
          readyHunterIds: [hunterId],
          startedByHunterId: hunterId,
          lootProgress: {},
        };
        set({
          campaign: tryAdvanceToActive(
            touch({ ...s.campaign, activeQuest }),
          ),
        });
        return { ok: true };
      },

      joinQuest: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) {
          return { ok: false, reason: "Keine aktive Quest." };
        }
        const aq = s.campaign.activeQuest;
        if (aq.phase !== "lobby") {
          return { ok: false, reason: "Quest bereits gestartet." };
        }
        if (aq.readyHunterIds.includes(hunterId)) {
          return { ok: true };
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

      completeQuestFailure: () =>
        set((s) => {
          if (!s.campaign?.activeQuest) return s;
          const quest = questById(s.campaign.activeQuest.questId);
          let questCompletions = s.campaign.questCompletions;
          if (quest && shouldIncrementOnFailure(quest)) {
            const cur = questCompletions[quest.id] ?? 0;
            if (canIncrementQuestCompletion(quest, cur)) {
              questCompletions = {
                ...questCompletions,
                [quest.id]: cur + 1,
              };
            }
          }
          return {
            campaign: touch({
              ...s.campaign,
              questCompletions,
              activeQuest: null,
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
          const progress = s.campaign.activeQuest.lootProgress[hunterId];
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...s.campaign.activeQuest,
                lootProgress: {
                  ...s.campaign.activeQuest.lootProgress,
                  [hunterId]: {
                    ...progress,
                    dice,
                    choice: undefined,
                  },
                },
              },
            }),
          };
        }),

      setLootChoice: (hunterId, choice) =>
        set((s) => {
          if (!s.campaign?.activeQuest?.lootProgress[hunterId]) return s;
          const progress = s.campaign.activeQuest.lootProgress[hunterId];
          return {
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...s.campaign.activeQuest,
                lootProgress: {
                  ...s.campaign.activeQuest.lootProgress,
                  [hunterId]: { ...progress, choice },
                },
              },
            }),
          };
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
            campaign: touch({
              ...s.campaign,
              activeQuest: {
                ...s.campaign.activeQuest,
                lootProgress: {
                  ...s.campaign.activeQuest.lootProgress,
                  [hunterId]: { ...progress, brokenParts },
                },
              },
            }),
          };
        }),

      confirmLoot: (hunterId) => {
        const s = get();
        if (!s.campaign?.activeQuest) return;
        const aq = s.campaign.activeQuest;
        const progress = aq.lootProgress[hunterId];
        if (!progress?.choice) return;

        const quest = questById(aq.questId);
        if (!quest) return;
        const table = lootTableForMonster(quest.monsterId);
        if (!table) return;

        const rewards = resolveLootChoice(
          table,
          progress.dice,
          progress.choice,
          progress.brokenParts,
        );

        let campaign = touch({
          ...s.campaign,
          activeQuest: {
            ...aq,
            lootProgress: {
              ...aq.lootProgress,
              [hunterId]: { ...progress, confirmed: true },
            },
          },
          hunters: s.campaign.hunters.map((h) =>
            h.id === hunterId ? applyLootToHunter(h, rewards) : h,
          ),
        });

        const allConfirmed = campaign.hunters.every(
          (h) => campaign.activeQuest?.lootProgress[h.id]?.confirmed,
        );

        if (allConfirmed && quest) {
          const cur = campaign.questCompletions[aq.questId] ?? 0;
          campaign = touch({
            ...campaign,
            questCompletions: canIncrementQuestCompletion(quest, cur)
              ? {
                  ...campaign.questCompletions,
                  [aq.questId]: cur + 1,
                }
              : campaign.questCompletions,
            activeQuest: null,
          });
        }

        set({ campaign });
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
