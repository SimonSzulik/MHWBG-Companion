import { useState } from "react";
import { Screen } from "../ui/Screen";
import { Stepper } from "../ui/Stepper";
import { useCampaign } from "../store/campaign";
import { gameData } from "../data/gameData";
import type { Material, MaterialCategory } from "../domain/types";

type Tab = "materials" | "parts" | "items";

const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  ore: "Erze & Knochen",
  bone: "Erze & Knochen",
  monster: "Monsterteile",
  special: "Besonderes",
};

/** Inventory drill-in: tabbed material / parts / items counters. */
export function Inventory() {
  const [tab, setTab] = useState<Tab>("materials");
  const campaign = useCampaign((s) => s.campaign);
  const setMaterial = useCampaign((s) => s.setMaterial);
  const adjustItem = useCampaign((s) => s.adjustItem);
  if (!campaign) return null;

  const oresBones = gameData.materials.filter(
    (m) => m.category === "ore" || m.category === "bone",
  );
  const parts = gameData.materials.filter(
    (m) => m.category === "monster" || m.category === "special",
  );

  return (
    <Screen title="Inventar" subtitle="Geteiltes Lager">
      <div className="mb-4 flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold">
        <TabBtn active={tab === "materials"} onClick={() => setTab("materials")}>
          Material
        </TabBtn>
        <TabBtn active={tab === "parts"} onClick={() => setTab("parts")}>
          Teile
        </TabBtn>
        <TabBtn active={tab === "items"} onClick={() => setTab("items")}>
          Items
        </TabBtn>
      </div>

      {tab === "materials" && (
        <MaterialList
          materials={oresBones}
          heading={CATEGORY_LABEL.ore}
          qtyOf={(id) => campaign.materials[id] ?? 0}
          onSet={setMaterial}
        />
      )}

      {tab === "parts" && (
        <MaterialList
          materials={parts}
          heading={CATEGORY_LABEL.monster}
          qtyOf={(id) => campaign.materials[id] ?? 0}
          onSet={setMaterial}
        />
      )}

      {tab === "items" && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs uppercase tracking-wide text-accent">
            Verbrauchsgegenstände
          </p>
          {gameData.items.map((it) => (
            <Row key={it.id} name={it.name}>
              <Stepper
                value={campaign.items[it.id] ?? 0}
                onChange={(next) =>
                  adjustItem(it.id, next - (campaign.items[it.id] ?? 0))
                }
              />
            </Row>
          ))}
        </div>
      )}

      <div className="mt-5 paper-card flex items-center justify-between px-4 py-3">
        <span className="font-semibold">Zenny</span>
        <ZennyEditor />
      </div>
    </Screen>
  );
}

function MaterialList({
  materials,
  heading,
  qtyOf,
  onSet,
}: {
  materials: Material[];
  heading: string;
  qtyOf: (id: string) => number;
  onSet: (id: string, qty: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs uppercase tracking-wide text-accent">{heading}</p>
      {materials.map((m) => (
        <Row key={m.id} name={m.name} sub={m.source}>
          <Stepper value={qtyOf(m.id)} onChange={(next) => onSet(m.id, next)} />
        </Row>
      ))}
      {materials.length === 0 && (
        <p className="px-1 text-sm text-ink-soft">Nichts hier.</p>
      )}
    </div>
  );
}

function Row({
  name,
  sub,
  children,
}: {
  name: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="paper-card flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        {sub && <p className="truncate text-xs text-ink-soft">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function ZennyEditor() {
  const campaign = useCampaign((s) => s.campaign);
  const adjustZenny = useCampaign((s) => s.adjustZenny);
  if (!campaign) return null;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => adjustZenny(-100)}
        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2 font-bold active:translate-y-px"
      >
        −
      </button>
      <span className="w-16 text-center font-semibold tabular-nums">
        {campaign.zenny}
      </span>
      <button
        type="button"
        onClick={() => adjustZenny(100)}
        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-accent font-bold text-white active:translate-y-px"
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
      className={`flex-1 rounded-lg px-3 py-2 transition ${
        active ? "bg-accent text-white" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}
