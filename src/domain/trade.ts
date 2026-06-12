import { catalog } from "./catalog";
import type { Campaign, Hunter, TradeRequest } from "./types";

export function createTradeId(): string {
  return `trade-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  offeredMaterialId: string,
  requestedMaterialId: string,
): string | undefined {
  if (fromHunterId === toHunterId) return "Cannot trade with yourself.";
  const from = campaign.hunters.find((h) => h.id === fromHunterId);
  const to = campaign.hunters.find((h) => h.id === toHunterId);
  if (!from || !to) return "Hunter not found.";
  if (!catalog.material(offeredMaterialId)) return "Invalid offered material.";
  if (!catalog.material(requestedMaterialId)) return "Invalid requested material.";
  if (offeredMaterialId === requestedMaterialId) {
    return "Offer a different material than you request.";
  }
  if ((from.materials[offeredMaterialId] ?? 0) < 1) {
    return "You do not have that material.";
  }
  if ((to.materials[requestedMaterialId] ?? 0) < 1) {
    return "Partner does not have that material.";
  }
  if (
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

export function applyTradeSwap(
  hunters: Hunter[],
  trade: TradeRequest,
): Hunter[] {
  const fromIdx = hunters.findIndex((h) => h.id === trade.fromHunterId);
  const toIdx = hunters.findIndex((h) => h.id === trade.toHunterId);
  if (fromIdx < 0 || toIdx < 0) return hunters;

  const from = hunters[fromIdx];
  const to = hunters[toIdx];
  const fromMats = { ...from.materials };
  const toMats = { ...to.materials };

  fromMats[trade.offeredMaterialId] =
    (fromMats[trade.offeredMaterialId] ?? 0) - 1;
  if (fromMats[trade.offeredMaterialId] <= 0) {
    delete fromMats[trade.offeredMaterialId];
  }
  fromMats[trade.requestedMaterialId] =
    (fromMats[trade.requestedMaterialId] ?? 0) + 1;

  toMats[trade.requestedMaterialId] =
    (toMats[trade.requestedMaterialId] ?? 0) - 1;
  if (toMats[trade.requestedMaterialId] <= 0) {
    delete toMats[trade.requestedMaterialId];
  }
  toMats[trade.offeredMaterialId] = (toMats[trade.offeredMaterialId] ?? 0) + 1;

  return hunters.map((h, i) => {
    if (i === fromIdx) return { ...h, materials: fromMats };
    if (i === toIdx) return { ...h, materials: toMats };
    return h;
  });
}
