import type { Campaign, Hunter } from "../domain/types";

/** Hunters in this campaign that belong to other players. */
export function otherHunters(
  campaign: Campaign,
  userId: string | null,
): Hunter[] {
  return campaign.hunters.filter((h) => !isOwnHunter(h, userId));
}

/** The logged-in user's hunter in this campaign, if any. */
export function ownHunter(
  campaign: Campaign,
  userId: string | null,
): Hunter | undefined {
  if (userId) {
    const match = campaign.hunters.find((h) => h.userId === userId);
    // #region agent log
    fetch("http://127.0.0.1:7881/ingest/a7cdc541-ed7c-4afe-87a4-662a27c5f95a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5a8220",
      },
      body: JSON.stringify({
        sessionId: "5a8220",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "hunter.ts:ownHunter",
        message: "ownHunter resolve",
        data: {
          authUserId: userId,
          campaignId: campaign.id,
          hunterUserIds: campaign.hunters.map((h) => ({
            id: h.id,
            name: h.name,
            userId: h.userId ?? null,
          })),
          matchedId: match?.id ?? null,
          fallbackId: !match ? campaign.hunters[0]?.id ?? null : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (match) return match;
    return undefined;
  }
  return undefined;
}

export function isOwnHunter(hunter: Hunter, userId: string | null): boolean {
  return Boolean(userId && hunter.userId === userId);
}
