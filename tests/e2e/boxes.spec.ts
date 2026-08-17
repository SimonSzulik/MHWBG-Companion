import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor } from "./helpers/db";
import { shot } from "./helpers/shot";

/**
 * Per-campaign box selection: a group that owns only Ancient Forest must not be
 * offered Wildspire hunts or Hunter's Arsenal weapons.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();

let solo: Hunter;

test.beforeAll(async ({ browser }) => {
  solo = await Hunter.create(browser, "qa-box-aki");
});

test.afterAll(async () => {
  await solo?.dispose();
});

test("creating a campaign with only Ancient Forest hides the other boxes", async () => {
  await solo.page.goto("/onboarding/new");
  await solo.page.getByLabel("Campaign name").fill(`QA boxes ${JOIN_CODE}`);
  await solo.page.getByLabel("Join code").fill(JOIN_CODE);

  // Ancient Forest is ticked by default; the others are not.
  const wildspire = solo.page.getByRole("button", { name: "Box: Wildspire Waste" });
  const arsenal = solo.page.getByRole("button", { name: "Box: Hunter's Arsenal" });
  await expect(wildspire).toHaveAttribute("aria-pressed", "false");
  await expect(arsenal).toHaveAttribute("aria-pressed", "false");

  // Arsenal weapons are therefore not selectable.
  await expect(
    solo.page.getByRole("button", { name: /Hunting Horn/ }),
  ).toBeDisabled();
  await expect(
    solo.page.getByRole("button", { name: /Great Sword/ }),
  ).toBeEnabled();
  await shot(solo.page, "readme-boxes");

  await solo.page.getByRole("button", { name: /Great Sword/ }).first().click();
  await solo.page.getByRole("button", { name: "Off to the hunt!" }).click();
  await expect(solo.page.getByText("Share this join code:")).toBeVisible({
    timeout: 45_000,
  });
  await solo.page.getByRole("button", { name: "To Camp" }).click();
  await solo.waitForShell();

  const db = await clientFor("qa-box-aki");
  const campaign = await campaignByJoinCode(db, JOIN_CODE);
  expect(campaign!.boxes).toEqual(["core", "ancient-forest"]);
});

test("the quest board offers only Ancient Forest monsters", async () => {
  await solo.page.goto("/campaign/quests");
  await expect(solo.page.getByText("Quest Board")).toBeVisible({ timeout: 30_000 });

  await expect(solo.page.getByRole("button", { name: /Great Jagras/ }).first())
    .toBeVisible();
  for (const wildspire of ["Barroth", "Pukei-Pukei", "Diablos", "Black Diablos"]) {
    await expect(
      solo.page.getByRole("button", { name: new RegExp(wildspire) }),
      `${wildspire} must not be offered without Wildspire Waste`,
    ).toHaveCount(0);
  }
});

test("ticking Wildspire Waste adds its hunts and 20 campaign days", async () => {
  const db = await clientFor("qa-box-aki");
  const before = await campaignByJoinCode(db, JOIN_CODE);

  await solo.page.goto("/settings");
  await solo.page.getByRole("button", { name: "Box: Wildspire Waste" }).click();

  // The rulebook's +20 days for combining boxes (Ancient Forest p.38).
  await expect
    .poll(async () => (await campaignByJoinCode(db, JOIN_CODE))!.max_day, {
      timeout: 30_000,
    })
    .toBe(before!.max_day + 20);

  await solo.page.goto("/campaign/quests");
  await expect(
    solo.page.getByRole("button", { name: /Barroth/ }).first(),
  ).toBeVisible({ timeout: 30_000 });
});
