import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, huntersOf, stateOf, waitFor } from "./helpers/db";
import { shot } from "./helpers/shot";

/**
 * Captures the README screenshots from a *seeded* campaign, so the app looks
 * lived-in rather than empty: stocked material box, craftable forge nodes, a
 * completed hunt in the calendar, a full party.
 *
 *   E2E_BASE_URL=http://localhost:5173 npx playwright test screenshots
 *
 * Kept in the E2E suite deliberately — it reuses the same fixtures and viewport
 * as the tests, so the screenshots can never drift from what the tests exercise.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();

let aki: Hunter;
let brand: Hunter;
let cyra: Hunter;
let campaignId: string;

/** Enough of everything to make the forge and the box look used. */
const STARTING_MATERIALS: Record<string, number> = {
  "carbalite-ore": 12,
  "malachite-ore": 6,
  "dragonite-ore": 3,
  "quality-bone": 9,
  "monster-bone-small": 7,
  "monster-bone-medium": 5,
  "monster-keenbone": 2,
  "great-jagras-claw": 4,
  "great-jagras-hide": 5,
  "great-jagras-scale": 6,
  "great-jagras-mane": 2,
  "tobi-kadachi-pelt": 3,
  "tobi-kadachi-scale": 4,
  "tobi-kadachi-electrode": 2,
  "anjanath-scale": 3,
  "anjanath-pelt": 2,
  "anjanath-fang": 1,
  "sharp-claw": 4,
  "piercing-claw": 2,
  "flame-sac": 2,
  "electro-sac": 2,
  "thunder-sac": 1,
};

test.beforeAll(async ({ browser }) => {
  aki = await Hunter.create(browser, "Aki");
  brand = await Hunter.create(browser, "Renn");
  cyra = await Hunter.create(browser, "Sora");

  await createCampaign(aki, {
    name: "Fifth Fleet",
    joinCode: JOIN_CODE,
    weapon: "Great Sword",
  });
  await joinCampaign(brand, { joinCode: JOIN_CODE, weapon: "Bow" });
  await joinCampaign(cyra, { joinCode: JOIN_CODE, weapon: "Hunting Horn" });

  const db = await clientFor("Aki");
  campaignId = (await campaignByJoinCode(db, JOIN_CODE))!.id;

  // Stock every hunter's box straight in Postgres — faster than driving the UI,
  // and it exercises the same pull path the app uses on load.
  const hunters = await waitFor(
    () => huntersOf(db, campaignId),
    (rows) => rows.length === 3,
  );
  for (const h of hunters) {
    await db.from("hunter").update({ materials: STARTING_MATERIALS }).eq("id", h.id);
  }
});

test.afterAll(async () => {
  await Promise.all([aki?.dispose(), brand?.dispose(), cyra?.dispose()]);
});

test("run one hunt so the calendar has history", async () => {
  const db = await clientFor("Aki");
  const quest = async () => (await stateOf(db, campaignId))?.active_quest;

  await aki.page.goto("/campaign/quests");
  await aki.page.getByRole("button", { name: /Great Jagras/ }).first().click();
  await waitFor(quest, (q) => q?.phase === "lobby", { timeout: 30_000 });

  await brand.page.goto("/campaign/quest");
  await waitFor(quest, (q) => q != null && q.readyHunterIds.length >= 2, {
    timeout: 30_000,
  });
  await cyra.page.goto("/campaign/quest");
  await waitFor(quest, (q) => q != null && q.readyHunterIds.length === 3, {
    timeout: 30_000,
  });

  await waitFor(quest, (q) => q?.phase === "investigation", { timeout: 30_000 });

  await aki.page.getByRole("button", { name: "Finished investigating" }).click();
  await waitFor(quest, (q) => q?.phase === "active", { timeout: 30_000 });
  await aki.page.getByRole("button", { name: "Completed" }).click();
  await waitFor(quest, (q) => q?.phase === "looting", { timeout: 30_000 });

  for (const hunter of [aki, brand, cyra]) {
    if (hunter !== aki) await hunter.page.goto("/campaign/quest");
    await expect(hunter.page.getByRole("button", { name: "Confirm loot" })).toBeVisible({
      timeout: 30_000,
    });
    await hunter.page
      .getByRole("button", { name: /^(\d+|Sum \(\d+\))$/ })
      .first()
      .click();
    await hunter.page.getByRole("button", { name: "Confirm loot" }).click();
    await hunter.page.getByRole("button", { name: "OK" }).click();
    await hunter.page.waitForTimeout(1_500);
  }

  // Clear the summary so Camp is the resting state.
  await aki.page.goto("/campaign/quest");
  const ok = aki.page.getByRole("button", { name: "OK" });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await waitFor(() => campaignByJoinCode(db, JOIN_CODE), (c) => c!.day >= 2, {
    timeout: 30_000,
  });
});

test("capture every screen", async () => {
  // Camp — the hub: status, party, calendar with a completed day.
  await aki.page.goto("/");
  await aki.waitForShell();
  await expect(aki.page.getByText("Aki", { exact: true })).toBeVisible({ timeout: 30_000 });
  await shot(aki.page, "readme-camp");

  // Box — personal material stash.
  await aki.page.goto("/inventory");
  await expect(aki.page.getByText("Carbalite Ore").first()).toBeVisible({
    timeout: 30_000,
  });
  await shot(aki.page, "readme-inventory");

  // Forge — weapon tree with craftable nodes.
  await aki.page.goto("/forge");
  await aki.page.waitForTimeout(1_200);
  await shot(aki.page, "readme-forge");

  // Quest board.
  await aki.page.goto("/campaign/quests");
  await expect(aki.page.getByText("Quest Board")).toBeVisible({ timeout: 30_000 });
  await shot(aki.page, "readme-quests");

  // Downtime.
  await aki.page.goto("/campaign/downtime");
  await expect(aki.page.getByText("Pet Poogie").first()).toBeVisible({
    timeout: 30_000,
  });
  await shot(aki.page, "readme-downtime");
  // Leave the day unstarted so the campaign stays tidy.
  const cancel = aki.page.getByRole("button", { name: "Cancel" });
  if (await cancel.isVisible().catch(() => false)) await cancel.click();

  // Reference — the offline rules handbook.
  await aki.page.goto("/reference");
  await aki.page.waitForTimeout(800);
  await shot(aki.page, "readme-reference");

  // Settings.
  await aki.page.goto("/settings");
  await aki.page.waitForTimeout(600);
  await shot(aki.page, "readme-settings");

  // Login screen, from a clean context.
  const guest = await aki.context.browser()!.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto("/login");
  await expect(
    guestPage.getByRole("heading", { name: "MHWBG Companion" }),
  ).toBeVisible({ timeout: 30_000 });
  await shot(guestPage, "readme-login");
  await guest.close();
});
