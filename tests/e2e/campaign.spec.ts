import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, huntersOf, waitFor } from "./helpers/db";
import { shot } from "./helpers/shot";

/**
 * Party formation: three real accounts, one real campaign, three concurrent
 * browser contexts. Everything downstream (lobby, trading, downtime) depends on
 * this working, so it is asserted both in the UI and in Postgres.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();
const CAMPAIGN_NAME = `QA ${JOIN_CODE}`;

let aki: Hunter;
let brand: Hunter;
let cyra: Hunter;

test.beforeAll(async ({ browser }) => {
  aki = await Hunter.create(browser, "qa-aki");
  brand = await Hunter.create(browser, "qa-brand");
  cyra = await Hunter.create(browser, "qa-cyra");
});

test.afterAll(async () => {
  await Promise.all([aki?.dispose(), brand?.dispose(), cyra?.dispose()]);
});

test("owner creates a campaign and it lands in Postgres", async () => {
  await createCampaign(aki, {
    name: CAMPAIGN_NAME,
    joinCode: JOIN_CODE,
    weapon: "Great Sword",
  });

  const db = await clientFor("qa-aki");
  const campaign = await campaignByJoinCode(db, JOIN_CODE);
  expect(campaign, "campaign row should exist").toBeTruthy();
  expect(campaign!.name).toBe(CAMPAIGN_NAME);
  expect(campaign!.day).toBe(1);

  const hunters = await huntersOf(db, campaign!.id);
  expect(hunters).toHaveLength(1);
  expect(hunters[0].weapon_type).toBe("Great Sword");
  expect(hunters[0].name).toBe("qa-aki");

  await shot(aki.page, "camp-owner-fresh");
});

test("two more hunters join with distinct weapons", async () => {
  await joinCampaign(brand, { joinCode: JOIN_CODE, weapon: "Bow" });
  await joinCampaign(cyra, { joinCode: JOIN_CODE, weapon: "Hunting Horn" });

  const db = await clientFor("qa-aki");
  const campaign = await campaignByJoinCode(db, JOIN_CODE);
  const hunters = await waitFor(
    () => huntersOf(db, campaign!.id),
    (rows) => rows.length === 3,
  );

  expect(hunters.map((h) => h.weapon_type).sort()).toEqual([
    "Bow",
    "Great Sword",
    "Hunting Horn",
  ]);
  expect(hunters.map((h) => h.name).sort()).toEqual(["qa-aki", "qa-brand", "qa-cyra"]);
});

test("a taken weapon cannot be claimed twice", async ({ browser }) => {
  const dupe = await Hunter.create(browser, "qa-dupe");
  await dupe.page.goto("/onboarding/join");
  await dupe.page.getByLabel("Join code").fill(JOIN_CODE);
  await dupe.page.getByRole("button", { name: "Next" }).click();

  const greatSword = dupe.page.getByRole("button", { name: /Great Sword/ }).first();
  await expect(greatSword).toBeVisible({ timeout: 30_000 });
  await expect(greatSword, "already-claimed weapon must be disabled").toBeDisabled();
  await expect(dupe.page.getByText("Taken").first()).toBeVisible();

  await shot(dupe.page, "join-weapon-taken");
  await dupe.dispose();
});

test("rejoining with an already-used code offers to open the campaign", async () => {
  await brand.page.goto("/onboarding/join");
  await brand.page.getByLabel("Join code").fill(JOIN_CODE);
  await brand.page.getByRole("button", { name: "Next" }).click();

  await expect(brand.page.getByText("You are already in this campaign.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(brand.page.getByRole("button", { name: "Open campaign" })).toBeVisible();
});

test("an invalid join code is rejected", async ({ browser }) => {
  const stranger = await Hunter.create(browser, "qa-stranger");
  await stranger.page.goto("/onboarding/join");
  await stranger.page.getByLabel("Join code").fill("ZZZZ9999");
  await stranger.page.getByRole("button", { name: "Next" }).click();

  await expect(stranger.page.getByText(/nicht gefunden|not found|Join/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(stranger.page).toHaveURL(/\/onboarding\/join/);
  await stranger.dispose();
});

test("the campaign hub lists the campaign for every member", async () => {
  for (const hunter of [aki, brand, cyra]) {
    await hunter.page.goto("/onboarding");
    await expect(
      hunter.page.getByRole("button", { name: new RegExp(CAMPAIGN_NAME) }),
    ).toBeVisible({ timeout: 30_000 });
  }
  await shot(aki.page, "onboarding-hub");
});
