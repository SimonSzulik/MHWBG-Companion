import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Campaign,
  Hunter,
  WeaponType,
  GearSlot,
  MaterialStash,
} from "../domain/types";
import { MAX_QUEST_COMPLETIONS } from "../data/quests";
import { gameData } from "../data/gameData";
import { canCraftGear } from "../domain/catalog";

/**
 * Local-first campaign store. Everything persists to localStorage so the app
 * works fully offline at the table — ideal for a board game. Cloud sync
 * (Supabase) will later mirror this state without changing the API here.
 */

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Maps legacy v2 material ids to v3 ids when rehydrating old saves. */
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

/** Legacy save shape before v4 (leaderId + questCompletions). */
type LegacyCampaign = Omit<Campaign, "leaderId" | "questCompletions"> & {
  leaderId?: string;
  questCompletions?: Record<string, number>;
  huntsCompleted?: Record<string, boolean>;
};

function migrateCampaign(raw: LegacyCampaign): Campaign {
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
  const { huntsCompleted: _removed, ...rest } = raw;
  return {
    ...rest,
    materials: migrateMaterials(rest.materials),
    leaderId: rest.leaderId ?? rest.hunters[0]?.id ?? "",
    questCompletions,
  };
}

const PERSIST_KEY = "mhwbg-campaign-v4";
const LEGACY_KEYS = ["mhwbg-campaign-v3", "mhwbg-campaign-v2"];

const campaignStorage = createJSONStorage<CampaignState>(() => ({
  getItem: (name) => {
    const current = localStorage.getItem(name);
    if (current) {
      try {
        const parsed = JSON.parse(current) as {
          state?: { campaign?: LegacyCampaign | null };
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
          state?: { campaign?: LegacyCampaign | null };
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

  /** Create a fresh campaign with one starting hunter (local draft before cloud upload). */
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

  /** Adjust a material by a delta (clamped at 0). */
  adjustMaterial: (materialId: string, delta: number) => void;
  setMaterial: (materialId: string, qty: number) => void;
  adjustItem: (itemId: string, delta: number) => void;

  /** Forge gear: spend materials, add to ownedGear. */
  craftGear: (gearId: string) => { ok: boolean; reason?: string };

  setDay: (day: number) => void;
  incrementQuest: (questId: string) => void;

  /**
   * Replace the local campaign with state pulled from the cloud. Used by the
   * sync layer; does not bump updatedAt (the remote value is authoritative)
   * so it won't bounce straight back as a new push.
   */
  applyRemoteCampaign: (campaign: Campaign) => void;
}

function touch(c: Campaign): Campaign {
  return { ...c, updatedAt: Date.now() };
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
        const starter = starterGearFor(weaponType);
        const newHunter: Hunter = {
          id: uid(),
          name: name || "Hunter",
          palicoName,
          weaponType,
          equipped: starter ? { weapon: starter } : {},
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
            materials: {},
            items: { potion: potions },
            ownedGear: starter ? [starter] : [],
            questCompletions: {},
            createdAt: now,
            updatedAt: now,
          },
        });
      },

      resetCampaign: () => set({ campaign: null }),

      addHunter: (input) =>
        set((s) => {
          if (!s.campaign) return s;
          const starter = starterGearFor(input.weaponType);
          const h: Hunter = {
            id: uid(),
            name: input.name || "Hunter",
            palicoName: input.palicoName,
            weaponType: input.weaponType,
            equipped: starter ? { weapon: starter } : {},
          };
          const ownedGear = starter
            ? Array.from(new Set([...s.campaign.ownedGear, starter]))
            : s.campaign.ownedGear;
          return {
            campaign: touch({
              ...s.campaign,
              hunters: [...s.campaign.hunters, h],
              ownedGear,
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

      adjustMaterial: (materialId, delta) =>
        set((s) => {
          if (!s.campaign) return s;
          const cur = s.campaign.materials[materialId] ?? 0;
          const next = Math.max(0, cur + delta);
          return {
            campaign: touch({
              ...s.campaign,
              materials: { ...s.campaign.materials, [materialId]: next },
            }),
          };
        }),

      setMaterial: (materialId, qty) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              materials: {
                ...s.campaign.materials,
                [materialId]: Math.max(0, Math.floor(qty) || 0),
              },
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

      craftGear: (gearId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "Keine Kampagne." };
        const def = gameData.gear.find((g) => g.id === gearId);
        if (!def) return { ok: false, reason: "Unbekanntes Gear." };
        if (s.campaign.ownedGear.includes(gearId))
          return { ok: false, reason: "Bereits gebaut." };
        if (!canCraftGear(def, s.campaign))
          return { ok: false, reason: "Voraussetzungen nicht erfüllt." };

        for (const c of def.cost) {
          if ((s.campaign.materials[c.materialId] ?? 0) < c.qty)
            return { ok: false, reason: "Material fehlt." };
        }

        const materials = { ...s.campaign.materials };
        for (const c of def.cost) {
          materials[c.materialId] = (materials[c.materialId] ?? 0) - c.qty;
        }
        set({
          campaign: touch({
            ...s.campaign,
            materials,
            ownedGear: [...s.campaign.ownedGear, gearId],
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
          const cur = s.campaign.questCompletions[questId] ?? 0;
          if (cur >= MAX_QUEST_COMPLETIONS) return s;
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
          campaign: migrateCampaign(campaign as LegacyCampaign),
        }),
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
// Hydration can finish in a microtask before this listener is registered.
if (useCampaign.persist.hasHydrated()) {
  useCampaign.setState({ hydrated: true });
}

/** Default starter weapon id per weapon type. */
function starterGearFor(weaponType: WeaponType): string | null {
  const starter = gameData.gear.find(
    (g) =>
      g.slot === "weapon" &&
      g.weaponType === weaponType &&
      g.isStarter === true,
  );
  if (starter) return starter.id;
  const fallback = gameData.gear.find(
    (g) =>
      g.slot === "weapon" && g.weaponType === weaponType && g.cost.length === 0,
  );
  return fallback?.id ?? null;
}
