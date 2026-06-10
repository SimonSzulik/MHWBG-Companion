import { useState } from "react";
import { gameData } from "../../data/gameData";
import { MAX_POTIONS } from "../../domain/downtime";
import { iconUrl } from "../../domain/icons";
import type { Material } from "../../domain/types";
import { BottomSheet } from "../BottomSheet";
import { Button } from "../Button";
import { SegmentedTabs } from "../SegmentedTabs";
import { LootMaterialPreviewList } from "../LootMaterialRow";

type Tab = "material" | "other";

function tileLabel(material: Material): string {
  return material.shortName ?? material.name;
}

/** Log items gathered during investigation; starter edits, party read-only. */
export function QuestInvestigationPanel({
  investigationLoot,
  canEdit,
  starterName,
  onSetQty,
  onFinish,
}: {
  investigationLoot: Record<string, number>;
  canEdit: boolean;
  starterName: string;
  onSetQty: (materialId: string, qty: number) => void;
  onFinish?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("material");
  const [showEmpty, setShowEmpty] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);

  const materials = gameData.materials.filter((m) => m.group === "material");
  const others = gameData.materials.filter((m) => m.group === "other");
  const items = tab === "material" ? materials : others;

  const qtyOf = (id: string) => investigationLoot[id] ?? 0;
  const potionQty = investigationLoot.potion ?? 0;

  const loggedIds = Object.entries(investigationLoot).filter(
    ([, q]) => q > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-ink-soft">
        Explore paths at the table, then log what the party gathered.
        {!canEdit && (
          <>
            {" "}
            Only <strong>{starterName}</strong> can edit items.
          </>
        )}
      </p>

      {(canEdit || potionQty > 0) && (
        <div className="paper-card flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <img src="/icons/potion.png" alt="" className="h-8 w-8 object-contain" />
            <div>
              <p className="text-sm font-semibold">Potions</p>
              <p className="text-[10px] text-ink-soft">Party stockpile</p>
            </div>
          </div>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetQty("potion", Math.max(0, potionQty - 1))}
                disabled={potionQty <= 0}
                className="grid h-9 w-9 place-items-center rounded border-[1.5px] border-line-strong bg-paper-2 text-lg font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-bold tabular-nums">
                {potionQty}
              </span>
              <button
                type="button"
                onClick={() =>
                  onSetQty("potion", Math.min(MAX_POTIONS, potionQty + 1))
                }
                disabled={potionQty >= MAX_POTIONS}
                className="grid h-9 w-9 place-items-center rounded border-[1.5px] border-line-strong bg-accent text-lg font-bold text-white disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold tabular-nums">×{potionQty}</span>
          )}
        </div>
      )}

      {canEdit && (
        <SegmentedTabs<Tab>
          value={tab}
          onChange={(next) => {
            setTab(next);
            setSelected(null);
            setShowEmpty(false);
          }}
          tabs={[
            { value: "material", label: "Material" },
            { value: "other", label: "Other" },
          ]}
        />
      )}

      {canEdit ? (
        <InvestigationGrid
          items={items}
          qtyOf={qtyOf}
          showEmpty={showEmpty}
          onToggleEmpty={() => setShowEmpty((v) => !v)}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      ) : loggedIds.length > 0 ? (
        <div className="paper-card p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-accent">
            Gathered items
          </p>
          <LootMaterialPreviewList
            quantities={investigationLoot}
            readOnly
            compact
          />
        </div>
      ) : (
        <div className="paper-card p-4 text-center text-sm text-ink-soft">
          No items logged yet.
        </div>
      )}

      {canEdit && selected && (
        <InvestigationItemSheet
          material={selected}
          qty={qtyOf(selected.id)}
          onSet={(next) => onSetQty(selected.id, next)}
          onClose={() => setSelected(null)}
        />
      )}

      {canEdit && onFinish && (
        <Button onClick={onFinish} className="w-full py-3 text-sm font-bold">
          Finished investigating
        </Button>
      )}

      {!canEdit && (
        <p className="text-center text-sm text-ink-soft">
          Waiting for {starterName} to finish investigating…
        </p>
      )}
    </div>
  );
}

function InvestigationGrid({
  items,
  qtyOf,
  showEmpty,
  onToggleEmpty,
  selectedId,
  onSelect,
}: {
  items: Material[];
  qtyOf: (id: string) => number;
  showEmpty: boolean;
  onToggleEmpty: () => void;
  selectedId: string | null;
  onSelect: (material: Material | null) => void;
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
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={`relative flex flex-col items-center rounded-xl border-[1.5px] px-1 pb-1.5 pt-2 active:scale-[0.97] ${
                selectedId === m.id
                  ? "border-accent bg-accent-faint ring-1 ring-accent"
                  : isEmpty
                    ? "border-dashed border-line bg-paper opacity-50"
                    : "border-line-strong bg-card"
              }`}
            >
              {qty > 0 && (
                <span className="absolute right-1 top-1 rounded-full bg-accent px-1.5 py-px text-[10px] font-bold leading-none text-white">
                  {qty}
                </span>
              )}
              <img
                src={iconUrl(m.iconType)}
                alt=""
                className="h-10 w-10 object-contain"
              />
              <span className="mt-1 w-full truncate px-0.5 text-center text-[9px] font-medium leading-tight">
                {tileLabel(m)}
              </span>
            </button>
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
          {showEmpty ? "Hide empty" : `+${empty.length} empty items`}
        </button>
      )}
    </div>
  );
}

function InvestigationItemSheet({
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
  return (
    <BottomSheet onClose={onClose} className="bg-[#2a231c] text-white">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/30" />
      <div className="flex items-center gap-3">
        <img
          src={iconUrl(material.iconType)}
          alt=""
          className="h-12 w-12 object-contain"
        />
        <div>
          <p className="font-display text-xl">{material.name}</p>
          <p className="text-xs text-white/60">Gathered this quest</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onSet(Math.max(0, qty - 1))}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/30 text-xl font-bold"
        >
          −
        </button>
        <span className="font-display text-3xl tabular-nums">{qty}</span>
        <button
          type="button"
          onClick={() => onSet(qty + 1)}
          className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-xl font-bold text-white"
        >
          +
        </button>
      </div>
      <Button
        variant="secondary"
        rounded="lg"
        onClick={onClose}
        className="mt-4 w-full bg-white/10 py-2 text-sm font-semibold text-white"
      >
        Done
      </Button>
    </BottomSheet>
  );
}
