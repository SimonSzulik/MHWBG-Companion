import type { Campaign, Hunter } from "../domain/types";
import { ownHunter } from "../lib/hunter";
import { useAuth } from "./auth";
import { useCampaign } from "./campaign";

/**
 * Active campaign plus the logged-in user's hunter within it.
 *
 * Collapses the `campaign` + `userId` + `ownHunter` lookup that every
 * hunter-scoped screen repeated. Screens typically guard with
 * `if (!campaign || !hunter) return null;`.
 */
export function useOwnHunter(): {
  campaign: Campaign | null;
  hunter: Hunter | undefined;
} {
  const campaign = useCampaign((s) => s.campaign);
  const userId = useAuth((s) => s.userId);
  return {
    campaign,
    hunter: campaign ? ownHunter(campaign, userId) : undefined,
  };
}
