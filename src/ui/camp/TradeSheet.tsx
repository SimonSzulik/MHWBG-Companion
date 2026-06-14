import { useState } from "react";
import type { Hunter, Material, TradeRequest } from "../../domain/types";
import { gameData } from "../../data/gameData";
import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { CraftButton } from "../forge/ForgeDetails";
import { Button } from "../Button";
import { BottomSheet } from "../BottomSheet";
import { SegmentedTabs } from "../SegmentedTabs";

type TradeTab = "material" | "monster";

function MaterialPicker({
  label,
  materials,
  qtyOf,
  selectedId,
  onSelect,
}: {
  label: string;
  materials: Material[];
  qtyOf: (id: string) => number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const available = materials.filter((m) => qtyOf(m.id) > 0);
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </p>
      {available.length === 0 ? (
        <p className="text-xs text-ink-soft">Nothing to trade.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {available.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`flex flex-col items-center rounded-lg border p-1 active:scale-95 ${
                selectedId === m.id
                  ? "border-accent bg-accent-faint ring-1 ring-accent"
                  : "border-line bg-card"
              }`}
            >
              <img
                src={iconUrl(m.iconType)}
                alt=""
                className="h-8 w-8 object-contain"
              />
              <span className="mt-0.5 max-w-full truncate text-[9px] font-medium">
                {m.shortName ?? m.name}
              </span>
              {m.group === "monster" && m.monsterId && (
                <span className="max-w-full truncate text-[8px] text-ink-soft">
                  {catalog.monster(m.monsterId)?.name ?? m.monsterId}
                </span>
              )}
              <span className="text-[9px] text-ink-soft">×{qtyOf(m.id)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Forge-style sheet to propose or respond to a 1-for-1 material trade. */
export function TradeSheet({
  self,
  partner,
  incoming,
  outgoing,
  onPropose,
  onAccept,
  onDecline,
  onCancel,
  onClose,
}: {
  self: Hunter;
  partner: Hunter;
  incoming?: TradeRequest;
  outgoing?: TradeRequest;
  onPropose: (offeredId: string, requestedId: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TradeTab>("material");
  const [offeredId, setOfferedId] = useState("");
  const [requestedId, setRequestedId] = useState("");

  const materials = gameData.materials.filter((m) => m.group === "material");
  const monsterItems = gameData.materials.filter((m) => m.group === "monster");
  const pickerItems = tab === "material" ? materials : monsterItems;

  const readOnly = Boolean(incoming);

  return (
    <BottomSheet onClose={onClose} className="max-h-[85vh] overflow-y-auto bg-paper">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
      <p className="font-display text-xl leading-tight">Trade with {partner.name}</p>
      <p className="mt-1 text-xs text-ink-soft">1 item for 1 item</p>

      <SegmentedTabs<TradeTab>
        className="mt-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "material", label: "Material" },
          { value: "monster", label: "Monster" },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MaterialPicker
          label={readOnly ? "They offer" : "You offer"}
          materials={pickerItems}
          qtyOf={(id) =>
            readOnly && incoming
              ? incoming.offeredMaterialId === id
                ? 1
                : 0
              : (self.materials[id] ?? 0)
          }
          selectedId={readOnly && incoming ? incoming.offeredMaterialId : offeredId}
          onSelect={readOnly ? () => {} : setOfferedId}
        />
        <MaterialPicker
          label={readOnly ? "They want" : "You want"}
          materials={pickerItems}
          qtyOf={(id) =>
            readOnly && incoming
              ? incoming.requestedMaterialId === id
                ? 1
                : 0
              : (partner.materials[id] ?? 0)
          }
          selectedId={
            readOnly && incoming ? incoming.requestedMaterialId : requestedId
          }
          onSelect={readOnly ? () => {} : setRequestedId}
        />
      </div>

      {incoming && (
        <CraftButton onClick={onAccept} label="Accept trade" />
      )}
      {incoming && (
        <Button
          variant="secondary"
          rounded="lg"
          onClick={onDecline}
          className="mt-2 w-full py-2 text-sm font-semibold"
        >
          Decline
        </Button>
      )}

      {!incoming && !outgoing && (
        <CraftButton
          onClick={() => {
            if (offeredId && requestedId) onPropose(offeredId, requestedId);
          }}
          label="Request trade"
          disabled={!offeredId || !requestedId}
        />
      )}

      {outgoing && !incoming && (
        <Button
          variant="secondary"
          rounded="lg"
          onClick={onCancel}
          className="mt-3 w-full py-2 text-sm font-semibold"
        >
          Cancel request
        </Button>
      )}

      <Button
        variant="secondary"
        rounded="lg"
        onClick={onClose}
        className="mt-3 w-full py-2 text-sm font-semibold"
      >
        Close
      </Button>
    </BottomSheet>
  );
}
