import { useState } from "react";
import { Screen } from "../ui/Screen";
import { Stepper } from "../ui/Stepper";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import { gameData } from "../data/gameData";
import { inventoryMonsters } from "../data/ancientForest";
import { iconUrl } from "../domain/icons";
import type { Material } from "../domain/types";

type Tab = "material" | "other" | "monster";

/** Inventory: Material, Other, Monster Teile with stepper counters. */
export function Inventory() {
  const [tab, setTab] = useState<Tab>("material");
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
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
  const monsterParts = gameData.materials.filter(
    (m) => m.group === "monster" && m.monsterId === selectedMonsterId,
  );
  const selectedMonster = inventoryMonsters.find(
    (m) => m.id === selectedMonsterId,
  );

  const qtyOf = (id: string) => hunter.materials[id] ?? 0;

  return (
    <Screen title="Inventar" subtitle={`${hunter.name} · Mein Lager`}>
      <div className="mb-4 flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold">
        <TabBtn
          active={tab === "material"}
          onClick={() => {
            setTab("material");
            setSelectedMonsterId(null);
          }}
        >
          Material
        </TabBtn>
        <TabBtn
          active={tab === "other"}
          onClick={() => {
            setTab("other");
            setSelectedMonsterId(null);
          }}
        >
          Other
        </TabBtn>
        <TabBtn
          active={tab === "monster"}
          onClick={() => setTab("monster")}
        >
          Monster
        </TabBtn>
      </div>

      {tab === "material" && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {materials.map((m) => (
            <MaterialCell
              key={m.id}
              material={m}
              qty={qtyOf(m.id)}
              onSet={(next) => setMaterial(hunter.id, m.id, next)}
              compact
            />
          ))}
        </div>
      )}

      {tab === "other" && (
        <div className="grid grid-cols-3 gap-2">
          {others.map((m) => (
            <OtherGridCell
              key={m.id}
              material={m}
              qty={qtyOf(m.id)}
              onSet={(next) => setMaterial(hunter.id, m.id, next)}
            />
          ))}
        </div>
      )}

      {tab === "monster" && !selectedMonsterId && (
        <MonsterPicker onSelect={setSelectedMonsterId} />
      )}

      {tab === "monster" && selectedMonsterId && selectedMonster && (
        <div>
          <button
            type="button"
            onClick={() => setSelectedMonsterId(null)}
            className="mb-3 flex items-center gap-1 text-sm font-semibold text-accent active:translate-y-px"
          >
            ← Monster
          </button>
          <p className="mb-3 px-1 font-display text-xl">
            {selectedMonster.name}
          </p>
          <div className="flex flex-col gap-2">
            {monsterParts.map((m) => (
              <MaterialRow
                key={m.id}
                material={m}
                label={m.shortName ?? m.name}
                qty={qtyOf(m.id)}
                onSet={(next) => setMaterial(hunter.id, m.id, next)}
                showMonsterIcon
              />
            ))}
          </div>
        </div>
      )}

    </Screen>
  );
}

function MonsterPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const topRow = inventoryMonsters.slice(0, 2);
  const midRow = inventoryMonsters.slice(2, 4);
  const bottom = inventoryMonsters[4];

  return (
    <div className="rounded-xl border-[3px] border-double border-line-strong bg-paper-2 p-4">
      <div className="grid grid-cols-2 gap-4">
        {topRow.map((m) => (
          <MonsterPickerButton key={m.id} monster={m} onSelect={onSelect} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {midRow.map((m) => (
          <MonsterPickerButton key={m.id} monster={m} onSelect={onSelect} />
        ))}
      </div>
      {bottom && (
        <div className="mt-4 flex justify-center">
          <MonsterPickerButton monster={bottom} onSelect={onSelect} wide />
        </div>
      )}
    </div>
  );
}

function MonsterPickerButton({
  monster,
  onSelect,
  wide,
}: {
  monster: { id: string; name: string };
  onSelect: (id: string) => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(monster.id)}
      className={`flex flex-col items-center gap-2 active:translate-y-px ${
        wide ? "w-36" : "w-full"
      }`}
    >
      <img
        src={iconUrl(monster.id)}
        alt=""
        className="h-20 w-20 object-contain"
      />
      <span className="text-center text-xs font-semibold leading-tight">
        {monster.name}
      </span>
    </button>
  );
}

function MaterialCell({
  material,
  qty,
  onSet,
  compact,
}: {
  material: Material;
  qty: number;
  onSet: (next: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`paper-card flex flex-col gap-1 px-2 py-2 ${compact ? "text-xs" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <img
          src={iconUrl(material.iconType)}
          alt=""
          className="h-4 w-4 shrink-0 object-contain"
        />
        <span className="min-w-0 flex-1 truncate font-medium leading-tight">
          {material.name}
        </span>
      </div>
      <div className="flex justify-center">
        <CompactStepper value={qty} onChange={onSet} />
      </div>
    </div>
  );
}

function OtherGridCell({
  material,
  qty,
  onSet,
}: {
  material: Material;
  qty: number;
  onSet: (next: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 py-2 text-center">
      <img
        src={iconUrl(material.iconType)}
        alt=""
        className="h-8 w-8 object-contain"
      />
      <span className="text-[10px] font-medium leading-tight">
        {material.name}
      </span>
      <CompactStepper value={qty} onChange={onSet} />
    </div>
  );
}

function MaterialRow({
  material,
  label,
  qty,
  onSet,
  showMonsterIcon,
}: {
  material: Material;
  label: string;
  qty: number;
  onSet: (next: number) => void;
  showMonsterIcon?: boolean;
}) {
  return (
    <div className="paper-card flex items-center justify-between gap-2 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 items-center gap-0.5">
          <img
            src={iconUrl(material.iconType)}
            alt=""
            className="h-5 w-5 object-contain"
          />
          {showMonsterIcon && material.monsterId && (
            <img
              src={iconUrl(material.monsterId)}
              alt=""
              className="h-5 w-5 object-contain"
            />
          )}
        </div>
        <span className="truncate font-medium">{label}</span>
      </div>
      <Stepper value={qty} onChange={onSet} />
    </div>
  );
}

/** Smaller stepper for grid cells. */
function CompactStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="weniger"
        disabled={value <= 0}
        className="grid h-7 w-7 place-items-center rounded border-[1.5px] border-line-strong bg-paper-2 text-sm font-bold active:translate-y-px disabled:opacity-40"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="mehr"
        className="grid h-7 w-7 place-items-center rounded border-[1.5px] border-line-strong bg-accent text-sm font-bold text-white active:translate-y-px"
      >
        +
      </button>
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
