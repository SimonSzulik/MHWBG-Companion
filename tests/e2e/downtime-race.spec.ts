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
 *
 * Note each hunter must pick exactly `MAX_DOWNTIME_PICKS` (3) activities and
 * resolve all of them before "Finish day" enables — that is the rule, not a
 * bug. Poogie, Chef and Resource Center are the three that resolve without
 * spending materials or starting a quest.
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

test("concurrent downtime confirmations are all recorded", async () => {
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

  // Each hunter picks and resolves their three activities. Done one at a time,
  // so the race under test is purely the confirmation below.
  for (const hunter of [aki, brand, cyra]) {
    await hunter.page.getByText("Pet Poogie").first().click();
    const done = hunter.page.getByRole("button", { name: "Done" });
    await done.waitFor({ state: "visible", timeout: 20_000 });
    await done.click();

    await hunter.page.getByText("Meowscular Chef").first().click();
    await hunter.page.getByRole("button", { name: "Fire", exact: true }).click();
    // The Chef panel stays open after choosing (unlike Poogie and the Resource
    // Center, which close themselves), so step back out to the activity list.
    await hunter.page.goto("/campaign/downtime");

    await hunter.page.getByText("Resource Center").first().click();
    await hunter.page
      .getByRole("button", { name: /Confirm roll|Update roll/ })
      .click();

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

  // QA-6: every hunter's confirmation and picks must survive the concurrent
  // write. Before merge_active_downtime, only one of three survived.
  const settled = await waitFor(
    downtime,
    (d) => d == null || (d.confirmedHunterIds ?? []).length === 3,
    { timeout: 40_000 },
  );
  if (settled != null) {
    expect(
      settled.confirmedHunterIds,
      "every hunter's confirmation must survive concurrent writes",
    ).toHaveLength(3);
    expect(Object.keys(settled.picks)).toHaveLength(3);
  }
});

test("the day advances once every hunter has confirmed", async () => {
  // KNOWN BUG (QA-7), separate from QA-6 above. The confirmations now all
  // reach the server, but `confirmDowntime` decides "everyone is confirmed"
  // from the confirming client's own view, so when the party taps "Finish day"
  // together nobody ever observes the full set and the day never advances.
  // The party is stranded on "waiting for N more hunters".
  test.fail(true, "QA-7: nobody re-checks all-confirmed after a remote update");

  const db = await clientFor("qa-dt-aki");
  const campaign = await waitFor(
    () => campaignByJoinCode(db, JOIN_CODE),
    (c) => c!.day === 2,
    { timeout: 30_000 },
  );
  expect(campaign!.day).toBe(2);
});
