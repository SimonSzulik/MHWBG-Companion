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
    if (match) return match;
    return undefined;
  }
  return undefined;
}

export function isOwnHunter(hunter: Hunter, userId: string | null): boolean {
  return Boolean(userId && hunter.userId === userId);
}
