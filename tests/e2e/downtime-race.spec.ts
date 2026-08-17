import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, stateOf, waitFor } from "./helpers/db";

/**
 * A downtime day is by design "everyone picks their activities, then everyone
 * confirms" — so `campaign_state.active_downtime` (six hunter-keyed maps plus
 * `confirmedHunterIds`) is written concurrently as a matter of course.
 *
 * If a confirmation is lost the day never advances: the party is stuck on
 * "waiting for N more hunters" with no way forward. The day counter is
 * therefore the assertion that matters.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();

let aki: Hunter;
let brand: Hunter;
let cyra: Hunter;
let campaignId: string;

test.beforeAll(async ({ browser }) => {
  aki = await Hunter.create(browser, "qa-dt-aki");
  brand = await Hunter.create(browser, "qa-dt-brand");
  cyra = await Hunter.create(browser, "qa-dt-cyra");

  await createCampaign(aki, {
    name: `QA downtime ${JOIN_CODE}`,
    joinCode: JOIN_CODE,
    weapon: "Great Sword",
  });
  await joinCampaign(brand, { joinCode: JOIN_CODE, weapon: "Bow" });
  await joinCampaign(cyra, { joinCode: JOIN_CODE, weapon: "Hunting Horn" });

  const db = await clientFor("qa-dt-aki");
  campaignId = (await campaignByJoinCode(db, JOIN_CODE))!.id;
});

test.afterAll(async () => {
  await Promise.all([aki?.dispose(), brand?.dispose(), cyra?.dispose()]);
});

test("a downtime day resolved by everyone at once still advances", async () => {
  // UNFINISHED (QA-6). This reproduces something real — the second hunter's
  // pick does not survive long enough for "Finish day" to enable — but it is
  // not yet isolated well enough to say whether the cause is the same
  // last-write-wins clobbering as QA-1/QA-2 or a slower sync settle. Marked
  // fixme rather than deleted so the work is not lost. See docs/qa/e2e-report.md.
  test.fixme(true, "QA-6: downtime concurrency not yet diagnosed");

  const db = await clientFor("qa-dt-aki");
  const downtime = async () => (await stateOf(db, campaignId))?.active_downtime;

  // One hunter opens the downtime day; the others follow.
  await aki.page.goto("/campaign/downtime");
  await waitFor(downtime, (d) => d != null, { timeout: 30_000 });

  await Promise.all([
    brand.page.goto("/campaign/downtime"),
    cyra.page.goto("/campaign/downtime"),
  ]);
  for (const hunter of [aki, brand, cyra]) {
    await expect(hunter.page.getByText("Pet Poogie").first()).toBeVisible({
      timeout: 30_000,
    });
  }

  // Each hunter picks Poogie (the one activity with no further choices) and
  // resolves it. Done one at a time, so the race under test is purely the
  // confirmation below.
  for (const hunter of [aki, brand, cyra]) {
    await hunter.page.getByText("Pet Poogie").first().click();
    const done = hunter.page.getByRole("button", { name: "Done" });
    await done.waitFor({ state: "visible", timeout: 20_000 });
    await done.click();
    await expect(
      hunter.page.getByRole("button", { name: "Finish day" }),
    ).toBeEnabled({ timeout: 20_000 });
  }

  // …then all three finish the day at the same moment.
  await Promise.all(
    [aki, brand, cyra].map(async (hunter) => {
      await hunter.page.getByRole("button", { name: "Finish day" }).click();
      const yes = hunter.page.getByRole("button", { name: "Yes" });
      await yes.waitFor({ state: "visible", timeout: 20_000 });
      await yes.click();
    }),
  );

  // If any confirmation were dropped, the day would never advance.
  const campaign = await waitFor(
    () => campaignByJoinCode(db, JOIN_CODE),
    (c) => c!.day === 2,
    { timeout: 40_000 },
  );
  expect(campaign!.day, "every hunter's confirmation must survive").toBe(2);

  const after = await stateOf(db, campaignId);
  expect(after!.active_downtime).toBeNull();
});
