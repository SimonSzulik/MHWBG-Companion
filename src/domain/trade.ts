import { catalog } from "./catalog";
import type { Campaign, Hunter, TradeRequest } from "./types";

export function createTradeId(): string {
  return `trade-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function positiveEntries(stash: Record<string, number>): [string, number][] {
  return Object.entries(stash).filter(([, qty]) => qty > 0);
}

/** Migrate legacy 1-for-1 trades to bundle format. */
export function normalizeTradeRequest(raw: unknown): TradeRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.fromHunterId !== "string" ||
    typeof o.toHunterId !== "string" ||
    (o.status !== "pending" &&
      o.status !== "accepted" &&
      o.status !== "declined")
  ) {
    return null;
  }

  if (o.offered && typeof o.offered === "object" && o.requested && typeof o.requested === "object") {
    const offered: Record<string, number> = {};
    const requested: Record<string, number> = {};
    for (const [id, qty] of Object.entries(o.offered as Record<string, unknown>)) {
      if (typeof qty === "number" && qty > 0) offered[id] = qty;
    }
    for (const [id, qty] of Object.entries(o.requested as Record<string, unknown>)) {
      if (typeof qty === "number" && qty > 0) requested[id] = qty;
    }
    return {
      id: o.id,
      fromHunterId: o.fromHunterId,
      toHunterId: o.toHunterId,
      offered,
      requested,
      status: o.status,
    };
  }

  if (
    typeof o.offeredMaterialId === "string" &&
    typeof o.requestedMaterialId === "string"
  ) {
    return {
      id: o.id,
      fromHunterId: o.fromHunterId,
      toHunterId: o.toHunterId,
      offered: { [o.offeredMaterialId]: 1 },
      requested: { [o.requestedMaterialId]: 1 },
      status: o.status,
    };
  }

  return null;
}

export function pendingTradeBetween(
  trades: TradeRequest[],
  fromHunterId: string,
  toHunterId: string,
): TradeRequest | undefined {
  return trades.find(
    (t) =>
      t.status === "pending" &&
      t.fromHunterId === fromHunterId &&
      t.toHunterId === toHunterId,
  );
}

/** Pending trade in either direction between two hunters. */
export function pendingTradeWith(
  trades: TradeRequest[],
  hunterA: string,
  hunterB: string,
): TradeRequest | undefined {
  return (
    pendingTradeBetween(trades, hunterA, hunterB) ??
    pendingTradeBetween(trades, hunterB, hunterA)
  );
}

export function validateTradeProposal(
  campaign: Campaign,
  fromHunterId: string,
  toHunterId: string,
  offered: Record<string, number>,
  requested: Record<string, number>,
  opts?: { skipPendingCheck?: boolean },
): string | undefined {
  if (fromHunterId === toHunterId) return "Cannot trade with yourself.";
  const from = campaign.hunters.find((h) => h.id === fromHunterId);
  const to = campaign.hunters.find((h) => h.id === toHunterId);
  if (!from || !to) return "Hunter not found.";

  const offeredEntries = positiveEntries(offered);
  const requestedEntries = positiveEntries(requested);
  if (offeredEntries.length === 0) return "Select items to offer.";
  if (requestedEntries.length === 0) return "Select items to request.";

  for (const [id, qty] of offeredEntries) {
    if (!catalog.material(id)) return "Invalid offered material.";
    if ((from.materials[id] ?? 0) < qty) {
      return "You do not have enough of an offered item.";
    }
    if ((requested[id] ?? 0) > 0) {
      return "Same item cannot be on both sides.";
    }
  }
  for (const [id, qty] of requestedEntries) {
    if (!catalog.material(id)) return "Invalid requested material.";
    if ((to.materials[id] ?? 0) < qty) {
      return "Partner does not have enough of a requested item.";
    }
    if ((offered[id] ?? 0) > 0) {
      return "Same item cannot be on both sides.";
    }
  }

  if (
    !opts?.skipPendingCheck &&
    pendingTradeWith(
      campaign.pendingTrades ?? [],
      fromHunterId,
      toHunterId,
    )
  ) {
    return "A pending trade already exists with this hunter.";
  }
  return undefined;
}

function applyBundleDelta(
  materials: Record<string, number>,
  delta: Record<string, number>,
  sign: 1 | -1,
): Record<string, number> {
  const next = { ...materials };
  for (const [id, qty] of positiveEntries(delta)) {
    const amount = sign * qty;
    next[id] = (next[id] ?? 0) + amount;
    if (next[id] <= 0) delete next[id];
  }
  return next;
}

export function applyTradeSwap(
  hunters: Hunter[],
  trade: TradeRequest,
): Hunter[] {
  const fromIdx = hunters.findIndex((h) => h.id === trade.fromHunterId);
  const toIdx = hunters.findIndex((h) => h.id === trade.toHunterId);
  if (fromIdx < 0 || toIdx < 0) return hunters;

  const from = hunters[fromIdx];
  const to = hunters[toIdx];
  let fromMats = { ...from.materials };
  let toMats = { ...to.materials };

  fromMats = applyBundleDelta(fromMats, trade.offered, -1);
  fromMats = applyBundleDelta(fromMats, trade.requested, 1);
  toMats = applyBundleDelta(toMats, trade.requested, -1);
  toMats = applyBundleDelta(toMats, trade.offered, 1);

  return hunters.map((h, i) => {
    if (i === fromIdx) return { ...h, materials: fromMats };
    if (i === toIdx) return { ...h, materials: toMats };
    return h;
  });
}
