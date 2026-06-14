import { useMemo, useState } from "react";
import type { Hunter, Material, TradeRequest } from "../../domain/types";
import { gameData } from "../../data/gameData";
import { catalog } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { CraftButton } from "../forge/ForgeDetails";
import { Button } from "../Button";
import { BottomSheet } from "../BottomSheet";
import { SegmentedTabs } from "../SegmentedTabs";
import { LootMaterialPreviewList } from "../LootMaterialRow";

type TradeTab = "material" | "other" | "monster";
type EditSide = "offer" | "want";

const TRADE_TABS: { value: TradeTab; label: string }[] = [
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
  { value: "monster", label: "Monster" },
];

function itemsForTab(tab: TradeTab): Material[] {
  if (tab === "material") {
    return gameData.materials.filter((m) => m.group === "material");
  }
  if (tab === "other") {
    return gameData.materials.filter((m) => m.group === "other");
  }
  return gameData.materials.filter((m) => m.group === "monster");
}

function setQty(
  stash: Record<string, number>,
  id: string,
  qty: number,
): Record<string, number> {
  const next = { ...stash };
  if (qty <= 0) delete next[id];
  else next[id] = qty;
  return next;
}

function TradeBundleEditor({
  side,
  setSide,
  tab,
  setTab,
  offered,
  setOffered,
  requested,
  setRequested,
  self,
  partner,
}: {
  side: EditSide;
  setSide: (side: EditSide) => void;
  tab: TradeTab;
  setTab: (tab: TradeTab) => void;
  offered: Record<string, number>;
  setOffered: (next: Record<string, number>) => void;
  requested: Record<string, number>;
  setRequested: (next: Record<string, number>) => void;
  self: Hunter;
  partner: Hunter;
}) {
  const items = itemsForTab(tab);
  const activeStash = side === "offer" ? offered : requested;
  const maxOf = (id: string) =>
    side === "offer"
      ? (self.materials[id] ?? 0)
      : (partner.materials[id] ?? 0);
  const otherStash = side === "offer" ? requested : offered;

  const visible = useMemo(
    () =>
      items.filter(
        (m) => maxOf(m.id) > 0 || (activeStash[m.id] ?? 0) > 0,
      ),
    [items, activeStash, side, self.materials, partner.materials],
  );

  const updateActive = (id: string, qty: number) => {
    const capped = Math.min(qty, maxOf(id));
    if (side === "offer") {
      setOffered(setQty(offered, id, capped));
    } else {
      setRequested(setQty(requested, id, capped));
    }
  };

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <BundleSummary label="You offer" quantities={offered} />
        <BundleSummary label="You want" quantities={requested} />
      </div>

      <SegmentedTabs<EditSide>
        className="mt-4"
        value={side}
        onChange={setSide}
        tabs={[
          { value: "offer", label: "Add to offer" },
          { value: "want", label: "Add to request" },
        ]}
      />

      <SegmentedTabs<TradeTab>
        className="mt-3"
        value={tab}
        onChange={setTab}
        tabs={TRADE_TABS}
      />

      {visible.length === 0 ? (
        <p className="mt-3 text-xs text-ink-soft">Nothing available in this tab.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {visible.map((m) => {
            const qty = activeStash[m.id] ?? 0;
            const blocked = (otherStash[m.id] ?? 0) > 0;
            return (
              <div
                key={m.id}
                className={`flex flex-col items-center rounded-lg border p-1 ${
                  qty > 0
                    ? "border-accent bg-accent-faint ring-1 ring-accent"
                    : "border-line bg-card"
                } ${blocked ? "opacity-40" : ""}`}
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
                <span className="text-[9px] text-ink-soft">×{maxOf(m.id)}</span>
                <div className="mt-1 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={blocked || qty <= 0}
                    onClick={() => updateActive(m.id, qty - 1)}
                    className="grid h-6 w-6 place-items-center rounded border border-line-strong text-xs font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-[10px] font-bold tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={blocked || qty >= maxOf(m.id)}
                    onClick={() => updateActive(m.id, qty + 1)}
                    className="grid h-6 w-6 place-items-center rounded bg-accent text-xs font-bold text-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function BundleSummary({
  label,
  quantities,
}: {
  label: string;
  quantities: Record<string, number>;
}) {
  const hasItems = Object.values(quantities).some((q) => q > 0);
  return (
    <div className="rounded-lg border border-line-strong bg-paper-2 p-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </p>
      {hasItems ? (
        <LootMaterialPreviewList quantities={quantities} readOnly compact />
      ) : (
        <p className="text-[10px] text-ink-soft">—</p>
      )}
    </div>
  );
}

/** Sheet to propose or respond to a multi-item trade bundle. */
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
  onPropose: (offered: Record<string, number>, requested: Record<string, number>) => void;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TradeTab>("material");
  const [side, setSide] = useState<EditSide>("offer");
  const [offered, setOffered] = useState<Record<string, number>>({});
  const [requested, setRequested] = useState<Record<string, number>>({});

  const readOnly = Boolean(incoming);
  const canPropose =
    Object.values(offered).some((q) => q > 0) &&
    Object.values(requested).some((q) => q > 0);

  return (
    <BottomSheet onClose={onClose} className="max-h-[85vh] overflow-y-auto bg-paper">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
      <p className="font-display text-xl leading-tight">Trade with {partner.name}</p>
      <p className="mt-1 text-xs text-ink-soft">
        Select all items, then propose one bundle trade
      </p>

      {readOnly && incoming ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <BundleSummary label="They offer" quantities={incoming.offered} />
          <BundleSummary label="They want" quantities={incoming.requested} />
        </div>
      ) : (
        <TradeBundleEditor
          side={side}
          setSide={setSide}
          tab={tab}
          setTab={setTab}
          offered={offered}
          setOffered={setOffered}
          requested={requested}
          setRequested={setRequested}
          self={self}
          partner={partner}
        />
      )}

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
          onClick={() => onPropose(offered, requested)}
          label="Request trade"
          disabled={!canPropose}
        />
      )}

      {outgoing && !incoming && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <BundleSummary label="You offered" quantities={outgoing.offered} />
            <BundleSummary label="You requested" quantities={outgoing.requested} />
          </div>
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onCancel}
            className="mt-3 w-full py-2 text-sm font-semibold"
          >
            Cancel request
          </Button>
        </>
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
