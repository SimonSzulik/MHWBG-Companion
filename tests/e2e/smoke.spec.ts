import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { shot } from "./helpers/shot";

/**
 * Harness self-check: proves the SSO bypass, the deployed bundle's Supabase
 * wiring and the sign-up path all work before the full matrix relies on them.
 */
test("harness reaches the deployed app and authenticates a real user", async ({ browser }) => {
  const hunter = await Hunter.create(browser, "qa-smoke");

  await expect(hunter.page).toHaveURL(/\/onboarding/);
  await expect(hunter.page.getByText(/Supabase not configured/i)).toHaveCount(0);
  await shot(hunter.page, "smoke-onboarding");

  await hunter.dispose();
});
