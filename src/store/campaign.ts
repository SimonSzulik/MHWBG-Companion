import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Campaign,
  Hunter,
  WeaponType,
  GearSlot,
} from "../domain/types";
import { wildspireWaste } from "../data/wildspireWaste";

/**
 * Local-first campaign store. Everything persists to localStorage so the app
 * works fully offline at the table — ideal for a board game. Cloud sync
 * (Supabase) will later mirror this state without changing the API here.
 */

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface NewHunterInput {
  name: string;
  weaponType: WeaponType;
  palicoName?: string;
  playerName?: string;
}

interface CampaignState {
  campaign: Campaign | null;

  /** Create a fresh campaign with one starting hunter. */
  startCampaign: (input: { campaignName?: string } & NewHunterInput) => void;
  resetCampaign: () => void;

  addHunter: (input: NewHunterInput) => void;
  updateHunter: (id: string, patch: Partial<Hunter>) => void;
  removeHunter: (id: string) => void;
  equipGear: (hunterId: string, slot: GearSlot, gearId: string | null) => void;

  /** Adjust a material by a delta (clamped at 0). */
  adjustMaterial: (materialId: string, delta: number) => void;
  setMaterial: (materialId: string, qty: number) => void;
  adjustItem: (itemId: string, delta: number) => void;
  adjustZenny: (delta: number) => void;

  /** Forge gear: spend materials + zenny, add to ownedGear. */
  craftGear: (gearId: string) => { ok: boolean; reason?: string };

  setDay: (day: number) => void;
  toggleHunt: (huntId: string) => void;

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

      startCampaign: ({ campaignName, ...hunter }) => {
        const starter = starterGearFor(hunter.weaponType);
        const newHunter: Hunter = {
          id: uid(),
          name: hunter.name || "Hunter",
          palicoName: hunter.palicoName,
          playerName: hunter.playerName,
          weaponType: hunter.weaponType,
          equipped: starter ? { weapon: starter } : {},
        };
        const now = Date.now();
        set({
          campaign: {
            id: uid(),
            name: campaignName || "Neue Kampagne",
            box: wildspireWaste.box,
            day: 1,
            maxDay: 60,
            hunters: [newHunter],
            zenny: 0,
            materials: {},
            items: { potion: 3 },
            ownedGear: starter ? [starter] : [],
            huntsCompleted: {},
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
            playerName: input.playerName,
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

      adjustItem: (itemId, delta) =>
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
        }),

      adjustZenny: (delta) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              zenny: Math.max(0, s.campaign.zenny + delta),
            }),
          };
        }),

      craftGear: (gearId) => {
        const s = get();
        if (!s.campaign) return { ok: false, reason: "Keine Kampagne." };
        const def = wildspireWaste.gear.find((g) => g.id === gearId);
        if (!def) return { ok: false, reason: "Unbekanntes Gear." };
        if (s.campaign.ownedGear.includes(gearId))
          return { ok: false, reason: "Bereits gebaut." };

        // check materials
        for (const c of def.cost) {
          if ((s.campaign.materials[c.materialId] ?? 0) < c.qty)
            return { ok: false, reason: "Material fehlt." };
        }
        if ((def.zenny ?? 0) > s.campaign.zenny)
          return { ok: false, reason: "Zenny fehlt." };

        const materials = { ...s.campaign.materials };
        for (const c of def.cost) {
          materials[c.materialId] = (materials[c.materialId] ?? 0) - c.qty;
        }
        set({
          campaign: touch({
            ...s.campaign,
            materials,
            zenny: s.campaign.zenny - (def.zenny ?? 0),
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

      toggleHunt: (huntId) =>
        set((s) => {
          if (!s.campaign) return s;
          return {
            campaign: touch({
              ...s.campaign,
              huntsCompleted: {
                ...s.campaign.huntsCompleted,
                [huntId]: !s.campaign.huntsCompleted[huntId],
              },
            }),
          };
        }),

      applyRemoteCampaign: (campaign) => set({ campaign }),
    }),
    { name: "mhwbg-campaign-v1" },
  ),
);

/** First weapon in a tree = the starter for that weapon type. */
function starterGearFor(weaponType: WeaponType): string | null {
  const starter = wildspireWaste.gear.find(
    (g) => g.slot === "weapon" && g.weaponType === weaponType && g.cost.length === 0,
  );
  return starter?.id ?? null;
}
