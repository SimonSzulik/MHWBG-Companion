import { expect, test, type Page } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, stateOf, waitFor } from "./helpers/db";
import { shot } from "./helpers/shot";

/**
 * The full co-op hunt: quest board gating → lobby → investigation → the fight →
 * per-hunter looting → party summary → day advance. Three concurrent contexts,
 * because most of the interesting rules are about what *other* hunters see.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();
const CAMPAIGN_NAME = `QA hunt ${JOIN_CODE}`;

let aki: Hunter;
let brand: Hunter;
let cyra: Hunter;
let campaignId: string;

/** The app reports rule violations through window.alert. */
function captureAlerts(page: Page, sink: string[]): void {
  page.on("dialog", (d) => {
    sink.push(d.message());
    void d.dismiss();
  });
}

const alerts: string[] = [];

test.beforeAll(async ({ browser }) => {
  aki = await Hunter.create(browser, "qa-hunt-aki");
  brand = await Hunter.create(browser, "qa-hunt-brand");
  cyra = await Hunter.create(browser, "qa-hunt-cyra");
  for (const h of [aki, brand, cyra]) captureAlerts(h.page, alerts);

  await createCampaign(aki, {
    name: CAMPAIGN_NAME,
    joinCode: JOIN_CODE,
    weapon: "Great Sword",
  });
  await joinCampaign(brand, { joinCode: JOIN_CODE, weapon: "Bow" });
  await joinCampaign(cyra, { joinCode: JOIN_CODE, weapon: "Hunting Horn" });

  const db = await clientFor("qa-hunt-aki");
  campaignId = (await campaignByJoinCode(db, JOIN_CODE))!.id;
});

test.afterAll(async () => {
  await Promise.all([aki?.dispose(), brand?.dispose(), cyra?.dispose()]);
});

test("quest board gates tiers: 1★ open, higher tiers locked", async () => {
  await aki.page.goto("/campaign/quests");
  await expect(aki.page.getByText("Quest Board")).toBeVisible({ timeout: 30_000 });

  // The Assigned (1★) accordion is open by default.
  const assigned = aki.page.getByRole("button", { name: /Great Jagras/ }).first();
  await expect(assigned).toBeEnabled();
  await expect(assigned).toContainText("0/");

  // Investigation tier: every row must be locked until its 1★ is cleared.
  await aki.page.getByRole("button", { name: /Investigation/ }).first().click();
  await expect(aki.page.getByLabel("locked").first()).toBeVisible();

  await shot(aki.page, "quest-board");
});

test("the lobby only releases the hunt once every hunter is ready", async () => {
  const db = await clientFor("qa-hunt-aki");
  const quest = async () => (await stateOf(db, campaignId))!.active_quest;

  await aki.page.goto("/campaign/quests");
  await aki.page.getByRole("button", { name: /Great Jagras/ }).first().click();

  await expect(aki.page).toHaveURL(/\/campaign\/quest$/, { timeout: 30_000 });
  await expect(aki.page.getByText("Waiting for all hunters…")).toBeVisible();
  await shot(aki.page, "quest-lobby");

  const afterStart = await waitFor(quest, (q) => q != null, { timeout: 30_000 });
  expect(afterStart.readyHunterIds).toHaveLength(1);
  expect(afterStart.phase, "one hunter ready → still a lobby").toBe("lobby");

  // Second hunter opens the lobby.
  await brand.page.goto("/campaign/quest");
  const afterSecond = await waitFor(quest, (q) => q.readyHunterIds.length >= 2, {
    timeout: 30_000,
  });
  expect(
    afterSecond.phase,
    "2 of 3 hunters ready must NOT release the hunt from the lobby",
  ).toBe("lobby");

  // Third hunter opens the lobby — now it may advance.
  await cyra.page.goto("/campaign/quest");
  const afterThird = await waitFor(quest, (q) => q.readyHunterIds.length === 3, {
    timeout: 30_000,
  });
  expect(afterThird.readyHunterIds).toHaveLength(3);
});

test("the party investigates and the starter closes the phase", async () => {
  // With all hunters ready the lobby releases on its own; force-start otherwise.
  const forceStart = aki.page.getByRole("button", { name: "Start now (test)" });
  if (await forceStart.isVisible().catch(() => false)) await forceStart.click();

  await expect(
    aki.page.getByRole("heading", { name: "Investigation" }),
  ).toBeVisible({ timeout: 30_000 });
  await shot(aki.page, "quest-investigation");

  // Only the quest starter may finish; the others are told to wait.
  await brand.page.goto("/campaign/quest");
  await expect(
    brand.page.getByRole("button", { name: "Finished investigating" }),
  ).toHaveCount(0);

  await aki.page.getByRole("button", { name: "Finished investigating" }).click();
  await expect(aki.page.getByRole("button", { name: "Completed" })).toBeVisible({
    timeout: 30_000,
  });
});

test("the hunt resolves and each hunter rolls their own loot", async () => {
  await shot(aki.page, "quest-active");
  await aki.page.getByRole("button", { name: "Completed" }).click();

  // Every hunter rolls, picks a die and confirms their personal loot. The
  // starter transitions in place; the others pick the phase up over realtime.
  for (const hunter of [aki, brand, cyra]) {
    if (hunter !== aki) await hunter.page.goto("/campaign/quest");
    await expect(hunter.page.getByRole("button", { name: "Confirm loot" })).toBeVisible({
      timeout: 30_000,
    });

    if (hunter === aki) await shot(hunter.page, "quest-looting");

    // Pick the first offered die value.
    await hunter.page
      .getByRole("button", { name: /^(\d+|Sum \(\d+\))$/ })
      .first()
      .click();
    await hunter.page.getByRole("button", { name: "Confirm loot" }).click();

    await expect(hunter.page.getByText("Rewards secured")).toBeVisible({
      timeout: 15_000,
    });
    if (hunter === aki) await shot(hunter.page, "quest-personal-loot");
    await hunter.page.getByRole("button", { name: "OK" }).click();

    // Let this hunter's confirmation reach Postgres before the next hunter
    // loads. Without this the next client can pull a pre-confirmation snapshot
    // and push it back, erasing the previous hunter's loot (see QA report).
    const db = await clientFor("qa-hunt-aki");
    await waitFor(
      async () => (await stateOf(db, campaignId))!.active_quest,
      (q) => q == null || countConfirmed(q) >= confirmedSoFar + 1,
      { timeout: 20_000 },
    );
    confirmedSoFar += 1;
  }
});

/** How many hunters have locked in their personal loot. */
function countConfirmed(activeQuest: { lootProgress?: Record<string, { confirmed?: boolean }> }): number {
  return Object.values(activeQuest.lootProgress ?? {}).filter((p) => p.confirmed).length;
}

let confirmedSoFar = 0;

test("the party summary lands and the campaign day advances", async () => {
  const db = await clientFor("qa-hunt-aki");

  // All three have confirmed, so the quest is either sitting on the party
  // summary or has already been dismissed past it.
  const state = await waitFor(
    () => stateOf(db, campaignId),
    (s) => s?.active_quest == null || s.active_quest.phase === "summary",
    { timeout: 30_000 },
  );

  if (state!.active_quest?.phase === "summary") {
    await aki.page.goto("/campaign/quest");
    await expect(
      aki.page.getByRole("heading", { name: "Quest summary" }),
    ).toBeVisible({ timeout: 30_000 });
    await shot(aki.page, "quest-summary");
    await aki.page.getByRole("button", { name: "OK" }).click();
  }

  // Day 1 -> 2, quest recorded, active quest cleared.
  const campaign = await waitFor(
    () => campaignByJoinCode(db, JOIN_CODE),
    (c) => c!.day === 2,
    { timeout: 30_000 },
  );
  expect(campaign!.day).toBe(2);

  const after = await stateOf(db, campaignId);
  expect(after!.active_quest).toBeNull();
  expect(after!.hunts_completed["great-jagras-1"]).toBe(1);
});

test("clearing the 1★ records the completion and unlocks the next tier", async () => {
  await aki.page.goto("/campaign/quests");
  await expect(aki.page.getByText("Quest Board")).toBeVisible({ timeout: 30_000 });

  // An assigned (1★) hunt caps at one completion, so it now reads "Completed!".
  const assignedJagras = aki.page.getByRole("button", { name: /Great Jagras/ }).first();
  await expect(assignedJagras).toContainText("Completed!", { timeout: 15_000 });
  await expect(assignedJagras).toBeDisabled();
  await shot(aki.page, "quest-board-after-clear");

  // The 2★ investigation for the same monster is now startable.
  await aki.page.getByRole("button", { name: /Investigation/ }).first().click();
  const investigationJagras = aki.page
    .getByRole("button", { name: /Great Jagras/ })
    .nth(1);
  await expect(investigationJagras).toBeEnabled({ timeout: 15_000 });
});

test("no rule violations were reported during the hunt", () => {
  expect(alerts, `unexpected alert(s): ${alerts.join(" | ")}`).toEqual([]);
});
