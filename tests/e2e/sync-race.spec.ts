import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, stateOf, waitFor } from "./helpers/db";

/**
 * Concurrency regression tests.
 *
 * `campaign_state.active_quest` is a single jsonb column holding per-hunter
 * sub-state (`readyHunterIds`, `lootProgress`), while the sync engine is
 * last-write-wins *per column*. Two clients mutating different hunters' entries
 * at the same time therefore each push a full blob built from their own
 * snapshot, and the loser's change is silently dropped.
 *
 * At a physical table this is the normal case, not an edge case: everyone taps
 * "join" when the quest starts, and everyone resolves loot together.
 */
test.describe.configure({ mode: "serial" });

let aki: Hunter;
let brand: Hunter;
let cyra: Hunter;

test.afterEach(async () => {
  await Promise.all([aki?.dispose(), brand?.dispose(), cyra?.dispose()]);
});

async function freshParty(browser: Parameters<typeof Hunter.create>[0]) {
  const joinCode = makeJoinCode();
  aki = await Hunter.create(browser, "qa-race-aki");
  brand = await Hunter.create(browser, "qa-race-brand");
  cyra = await Hunter.create(browser, "qa-race-cyra");

  await createCampaign(aki, {
    name: `QA race ${joinCode}`,
    joinCode,
    weapon: "Great Sword",
  });
  await joinCampaign(brand, { joinCode, weapon: "Bow" });
  await joinCampaign(cyra, { joinCode, weapon: "Hunting Horn" });

  const db = await clientFor("qa-race-aki");
  const campaignId = (await campaignByJoinCode(db, joinCode))!.id;
  const quest = async () => (await stateOf(db, campaignId))?.active_quest;
  return { joinCode, campaignId, db, quest };
}

test("two hunters opening the lobby at once both stay in the party", async ({
  browser,
}) => {
  const { quest } = await freshParty(browser);

  await aki.page.goto("/campaign/quests");
  await aki.page.getByRole("button", { name: /Great Jagras/ }).first().click();
  await waitFor(quest, (q) => q?.phase === "lobby", { timeout: 30_000 });

  // Both remaining hunters open the lobby simultaneously.
  await Promise.all([
    brand.page.goto("/campaign/quest"),
    cyra.page.goto("/campaign/quest"),
  ]);

  const settled = await waitFor(
    quest,
    (q) => q == null || q.phase !== "lobby" || q.readyHunterIds.length === 3,
    { timeout: 25_000 },
  );

  expect(
    settled?.readyHunterIds ?? [],
    "all three hunters must be registered as ready",
  ).toHaveLength(3);
});

test("simultaneous loot confirmations are not lost", async ({ browser }) => {
  const { quest } = await freshParty(browser);

  await aki.page.goto("/campaign/quests");
  await aki.page.getByRole("button", { name: /Great Jagras/ }).first().click();
  await waitFor(quest, (q) => q?.phase === "lobby", { timeout: 30_000 });

  // Stagger the lobby joins so this test isolates the *loot* race.
  await brand.page.goto("/campaign/quest");
  await waitFor(quest, (q) => q != null && q.readyHunterIds.length >= 2, {
    timeout: 30_000,
  });
  await cyra.page.goto("/campaign/quest");
  await waitFor(quest, (q) => q != null && q.readyHunterIds.length === 3, {
    timeout: 30_000,
  });

  const forceStart = aki.page.getByRole("button", { name: "Start now (test)" });
  if (await forceStart.isVisible().catch(() => false)) await forceStart.click();
  await waitFor(quest, (q) => q?.phase === "investigation", { timeout: 30_000 });

  await aki.page.getByRole("button", { name: "Finished investigating" }).click();
  await waitFor(quest, (q) => q?.phase === "active", { timeout: 30_000 });
  await aki.page.getByRole("button", { name: "Completed" }).click();
  await waitFor(quest, (q) => q?.phase === "looting", { timeout: 30_000 });

  const hunters = [aki, brand, cyra];
  for (const hunter of hunters) {
    if (hunter !== aki) await hunter.page.goto("/campaign/quest");
    await expect(hunter.page.getByRole("button", { name: "Confirm loot" })).toBeVisible({
      timeout: 30_000,
    });
    await hunter.page
      .getByRole("button", { name: /^(\d+|Sum \(\d+\))$/ })
      .first()
      .click();
  }

  // …then all three confirm at once.
  await Promise.all(
    hunters.map(async (hunter) => {
      await hunter.page.getByRole("button", { name: "Confirm loot" }).click();
      await hunter.page.getByRole("button", { name: "OK" }).click();
    }),
  );

  const final = await waitFor(
    quest,
    (q) => q == null || confirmedCount(q) === 3 || q.phase === "summary",
    { timeout: 30_000 },
  );

  if (final != null) {
    expect(
      confirmedCount(final),
      "every hunter's loot confirmation must survive concurrent writes",
    ).toBe(3);
  }
});

function confirmedCount(activeQuest: {
  lootProgress?: Record<string, { confirmed?: boolean }>;
}): number {
  return Object.values(activeQuest.lootProgress ?? {}).filter((p) => p.confirmed).length;
}
