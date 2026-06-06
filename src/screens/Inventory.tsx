import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import { gameData } from "../data/gameData";
import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import { useBodyScrollLock } from "../ui/forge/ForgeTreeCanvas";
import type { Material } from "../domain/types";

type Tab = "material" | "other" | "monster";

const ICON_SUB_LABELS: Record<string, string> = {
  "white-ore": "Ores",
  "white-bone": "Bones",
  "white-gem": "Crystals",
  "white-pelt": "Pelts",
  "white-sac": "Sacs",
  "white-claw": "Claws",
  "white-scale": "Scales",
  "white-carapace": "Carapace",
  "white-plate": "Plates",
  "white-shell": "Shells",
  "white-wing": "Wings",
  "white-tail": "Tails",
  "white-head": "Heads",
  "white-honey": "Webbing",
  "white-dump": "Mud",
  "white-juice": "Blood",
};

function iconSubLabel(material: Material): string {
  if (material.group === "monster" && material.monsterId) {
    return catalog.monster(material.monsterId)?.name ?? material.monsterId;
  }
  return ICON_SUB_LABELS[material.iconType] ?? material.group;
}

function tileLabel(material: Material, useShortName?: boolean): string {
  if (useShortName) return material.shortName ?? material.name;
  return material.name;
}

/** Inventory: Material, Other, Monster Teile with tap-to-edit sheet. */
export function Inventory() {
  const [tab, setTab] = useState<Tab>("material");
  const [showEmpty, setShowEmpty] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const campaign = useCampaign((s) => s.campaign);
  const setMaterial = useCampaign((s) => s.setMaterial);
  const userId = useAuth((s) => s.userId);
  if (!campaign) return null;

  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;

  const materials = gameData.materials.filter((m) => m.group === "material");
  const others = gameData.materials.filter((m) => m.group === "other");
  const monsterItems = gameData.materials.filter((m) => m.group === "monster");

  const qtyOf = (id: string) => hunter.materials[id] ?? 0;

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSelectedMaterial(null);
    setShowEmpty(false);
  };

  return (
    <Screen title="Inventar" subtitle={`${hunter.name} · Mein Lager`}>
      <div className="mb-4 flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold">
        <TabBtn
          active={tab === "material"}
          onClick={() => handleTabChange("material")}
        >
          Material
        </TabBtn>
        <TabBtn active={tab === "other"} onClick={() => handleTabChange("other")}>
          Other
        </TabBtn>
        <TabBtn active={tab === "monster"} onClick={() => handleTabChange("monster")}>
          Monster
        </TabBtn>
      </div>

      {tab === "material" && (
        <MaterialGrid
          items={materials}
          qtyOf={qtyOf}
          showEmpty={showEmpty}
          onToggleEmpty={() => setShowEmpty((v) => !v)}
          selectedId={selectedMaterial?.id ?? null}
          onSelect={setSelectedMaterial}
        />
      )}

      {tab === "other" && (
        <MaterialGrid
          items={others}
          qtyOf={qtyOf}
          showEmpty={showEmpty}
          onToggleEmpty={() => setShowEmpty((v) => !v)}
          selectedId={selectedMaterial?.id ?? null}
          onSelect={setSelectedMaterial}
        />
      )}

      {tab === "monster" && (
        <MaterialGrid
          items={monsterItems}
          qtyOf={qtyOf}
          showEmpty={showEmpty}
          onToggleEmpty={() => setShowEmpty((v) => !v)}
          selectedId={selectedMaterial?.id ?? null}
          onSelect={setSelectedMaterial}
          showMonsterBadge
          useShortName
        />
      )}

      {selectedMaterial && (
        <InventoryItemSheet
          material={selectedMaterial}
          qty={qtyOf(selectedMaterial.id)}
          onSet={(next) => setMaterial(hunter.id, selectedMaterial.id, next)}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </Screen>
  );
}

function MaterialGrid({
  items,
  qtyOf,
  showEmpty,
  onToggleEmpty,
  selectedId,
  onSelect,
  showMonsterBadge,
  useShortName,
}: {
  items: Material[];
  qtyOf: (id: string) => number;
  showEmpty: boolean;
  onToggleEmpty: () => void;
  selectedId: string | null;
  onSelect: (material: Material | null) => void;
  showMonsterBadge?: boolean;
  useShortName?: boolean;
}) {
  const owned = items.filter((m) => qtyOf(m.id) > 0);
  const empty = items.filter((m) => qtyOf(m.id) <= 0);
  const visible = showEmpty ? [...owned, ...empty] : owned;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {visible.map((m) => {
          const qty = qtyOf(m.id);
          const isEmpty = qty <= 0;
          return (
            <InventoryTile
              key={m.id}
              material={m}
              qty={qty}
              selected={selectedId === m.id}
              dimmed={isEmpty}
              showMonsterBadge={showMonsterBadge}
              label={tileLabel(m, useShortName)}
              onClick={() => onSelect(m)}
            />
          );
        })}
      </div>

      {empty.length > 0 && (
        <button
          type="button"
          onClick={onToggleEmpty}
          className={`mt-4 w-full rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-semibold active:translate-y-px ${
            showEmpty
              ? "border-line-strong bg-paper-2 text-ink-soft"
              : "border-accent bg-accent-faint text-accent"
          }`}
        >
          {showEmpty
            ? "Leere ausblenden"
            : `+${empty.length} leere Items anzeigen`}
        </button>
      )}

      {!showEmpty && owned.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-soft">
          Noch keine Items im Lager.
        </p>
      )}
    </div>
  );
}

function InventoryTile({
  material,
  qty,
  selected,
  dimmed,
  showMonsterBadge,
  label,
  onClick,
}: {
  material: Material;
  qty: number;
  selected: boolean;
  dimmed: boolean;
  showMonsterBadge?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-xl border-[1.5px] px-1 pb-1.5 pt-2 active:scale-[0.97] ${
        selected
          ? "border-accent bg-paper shadow-sm ring-1 ring-accent"
          : dimmed
            ? "border-dashed border-line bg-paper/40 opacity-50"
            : "border-accent/40 bg-paper"
      }`}
    >
      {showMonsterBadge && material.monsterId && (
        <span
          className={`absolute left-1 top-1 rounded-md border border-line-strong bg-paper-2 p-0.5 ${
            dimmed ? "opacity-50" : ""
          }`}
        >
          <img
            src={iconUrl(material.monsterId)}
            alt=""
            className="h-6 w-6 object-contain"
          />
        </span>
      )}
      <span
        className={`absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white ${
          dimmed ? "bg-ink-soft/50" : "bg-accent"
        }`}
      >
        {qty}
      </span>
      <img
        src={iconUrl(material.iconType)}
        alt=""
        className={`h-10 w-10 object-contain ${dimmed ? "opacity-40" : ""}`}
      />
      <span
        className={`mt-1 w-full truncate px-0.5 text-center text-[9px] font-medium leading-tight ${
          dimmed ? "text-ink-soft" : "text-ink"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function InventoryItemSheet({
  material,
  qty,
  onSet,
  onClose,
}: {
  material: Material;
  qty: number;
  onSet: (next: number) => void;
  onClose: () => void;
}) {
  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40">
      <button
        type="button"
        className="min-h-0 flex-1"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="rounded-t-2xl border-t border-line-strong bg-[#2a231c] px-4 pb-8 pt-4 shadow-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1">
              <img
                src={iconUrl(material.iconType)}
                alt=""
                className="h-10 w-10 object-contain"
              />
              {material.group === "monster" && material.monsterId && (
                <img
                  src={iconUrl(material.monsterId)}
                  alt=""
                  className="h-8 w-8 object-contain"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight text-white">
                {material.name}
              </p>
              <p className="text-xs text-[#cabfa9]">{iconSubLabel(material)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onSet(Math.max(0, qty - 1))}
              aria-label="weniger"
              disabled={qty <= 0}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#3d352c] text-lg font-bold text-white active:translate-y-px disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-2xl font-bold tabular-nums text-white">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onSet(qty + 1)}
              aria-label="mehr"
              className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-lg font-bold text-white active:translate-y-px"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-2 transition ${
        active ? "bg-accent text-white" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}
