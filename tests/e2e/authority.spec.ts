import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, stateOf, waitFor } from "./helpers/db";

/**
 * A campaign is shared, and anyone with the join code can walk in. That is
 * fine — but one hunter must not be able to overturn the group's campaign.
 *
 * Starting a hunt needs everyone; a hunt in progress belongs to whoever started
 * it; campaign settings belong to the leader.
 */
test.describe.configure({ mode: "serial" });

const CODE = makeJoinCode();
let leader: Hunter;   // creates the campaign, so also the leader
let guest: Hunter;    // joins afterwards
let campaignId: string;

test.beforeAll(async ({ browser }) => {
  leader = await Hunter.create(browser, "qa-auth-lead");
  guest = await Hunter.create(browser, "qa-auth-guest");

  await createCampaign(leader, {
    name: `QA authority ${CODE}`,
    joinCode: CODE,
    weapon: "Great Sword",
  });
  await joinCampaign(guest, { joinCode: CODE, weapon: "Bow" });

  const db = await clientFor("qa-auth-lead");
  campaignId = (await campaignByJoinCode(db, CODE))!.id;
});

test.afterAll(async () => {
  await Promise.all([leader?.dispose(), guest?.dispose()]);
});

test("the force-start bypass is gone from the UI", async () => {
  const db = await clientFor("qa-auth-lead");
  const quest = async () => (await stateOf(db, campaignId))?.active_quest;

  await leader.page.goto("/campaign/quests");
  await leader.page.getByRole("button", { name: /Great Jagras/ }).first().click();
  await waitFor(quest, (q) => q?.phase === "lobby", { timeout: 30_000 });

  // Neither the lobby screen nor the quest board offers a way to skip ahead.
  await expect(
    leader.page.getByRole("button", { name: /Start now/i }),
  ).toHaveCount(0);
  await leader.page.goto("/campaign/quests");
  await expect(
    leader.page.getByRole("button", { name: /Start now/i }),
  ).toHaveCount(0);
});

test("a hunt cannot start until every hunter has joined", async () => {
  const db = await clientFor("qa-auth-lead");
  const quest = async () => (await stateOf(db, campaignId))?.active_quest;

  // The guest has not opened the lobby, so the hunt must stay put.
  await leader.page.goto("/campaign/quest");
  await leader.page.waitForTimeout(4000);
  const stuck = await quest();
  expect(stuck!.phase, "one hunter alone must not start the hunt").toBe("lobby");
  expect(stuck!.readyHunterIds).toHaveLength(1);

  // Once the guest joins, it releases on its own.
  await guest.page.goto("/campaign/quest");
  const released = await waitFor(quest, (q) => q?.phase === "investigation", {
    timeout: 30_000,
  });
  expect(released!.phase).toBe("investigation");
});

test("only the quest starter can call the hunt", async () => {
  const db = await clientFor("qa-auth-lead");
  const quest = async () => (await stateOf(db, campaignId))?.active_quest;

  await leader.page.getByRole("button", { name: "Finished investigating" }).click();
  await waitFor(quest, (q) => q?.phase === "active", { timeout: 30_000 });

  // The guest is told to wait, and is offered no way to end it.
  await guest.page.goto("/campaign/quest");
  await expect(guest.page.getByText(/Waiting for .* to call the hunt/)).toBeVisible({
    timeout: 30_000,
  });
  await expect(guest.page.getByRole("button", { name: "Completed" })).toHaveCount(0);
  await expect(guest.page.getByRole("button", { name: "Failure" })).toHaveCount(0);

  // The starter can.
  await leader.page.getByRole("button", { name: "Completed" }).click();
  await waitFor(quest, (q) => q?.phase === "looting", { timeout: 30_000 });
});

test("only the leader can change which boxes the group owns", async () => {
  const db = await clientFor("qa-auth-lead");

  await guest.page.goto("/settings");
  const box = guest.page.getByRole("button", { name: "Box: Wildspire Waste" });
  await expect(box).toBeVisible({ timeout: 30_000 });
  await expect(box, "a guest must not be able to change the boxes").toBeDisabled();
  await expect(guest.page.getByText(/Only .* can change which boxes/)).toBeVisible();

  // The leader still can — but not mid-hunt, which is a separate guard.
  await leader.page.goto("/settings");
  await expect(
    leader.page.getByRole("button", { name: "Box: Wildspire Waste" }),
  ).toBeEnabled();

  const before = await campaignByJoinCode(db, CODE);
  expect(before!.boxes).not.toContain("wildspire-waste");
});

test("a solo hunter is unaffected by all of it", async ({ browser }) => {
  // Alone you are both starter and leader, so none of the guards may bite.
  const code = makeJoinCode();
  const solo = await Hunter.create(browser, "qa-auth-solo");
  const db = await clientFor("qa-auth-solo");

  await createCampaign(solo, {
    name: `QA solo ${code}`,
    joinCode: code,
    weapon: "Great Sword",
  });
  const id = (await campaignByJoinCode(db, code))!.id;
  const quest = async () => (await stateOf(db, id))?.active_quest;

  // Start a hunt: it must go straight to the investigation, no lobby wait.
  await solo.page.goto("/campaign/quests");
  await solo.page.getByRole("button", { name: /Great Jagras/ }).first().click();
  await waitFor(quest, (q) => q?.phase === "investigation", { timeout: 30_000 });

  // Call it, loot it, and see the day advance.
  await solo.page.getByRole("button", { name: "Finished investigating" }).click();
  await expect(solo.page.getByRole("button", { name: "Completed" })).toBeVisible({
    timeout: 30_000,
  });
  await solo.page.getByRole("button", { name: "Completed" }).click();
  await solo.page.getByRole("button", { name: /^(\d+|Sum \(\d+\))$/ }).first().click();
  await solo.page.getByRole("button", { name: "Confirm loot" }).click();
  await solo.page.getByRole("button", { name: "OK" }).click();

  const advanced = await waitFor(
    () => campaignByJoinCode(db, code),
    (c) => c!.day === 2,
    { timeout: 40_000 },
  );
  expect(advanced!.day).toBe(2);

  // And the settings are still their own to change.
  await solo.page.goto("/settings");
  await expect(
    solo.page.getByRole("button", { name: "Box: Wildspire Waste" }),
  ).toBeEnabled();

  await solo.dispose();
});
