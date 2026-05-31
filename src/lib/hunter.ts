import type { Campaign, Hunter } from "../domain/types";

/** The logged-in user's hunter, or the first hunter as fallback. */
export function ownHunter(
  campaign: Campaign,
  userId: string | null,
): Hunter | undefined {
  if (userId) {
    const match = campaign.hunters.find((h) => h.userId === userId);
    if (match) return match;
  }
  return campaign.hunters[0];
}

export function isOwnHunter(hunter: Hunter, userId: string | null): boolean {
  return Boolean(userId && hunter.userId === userId);
}
