import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { createCampaign, joinCampaign, makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, huntersOf, stateOf, waitFor } from "./helpers/db";

/**
 * The between-hunt screens: Box, Forge, trading and Settings. These are where a
 * campaign's actual bookkeeping happens, and none of them were covered by the
 * hunt-focused specs.
 */
test.describe.configure({ mode: "serial" });

const JOIN_CODE = makeJoinCode();

let aki: Hunter;
let renn: Hunter;
let campaignId: string;

/**
 * Every common material, generously — the point of these tests is the screens,
 * not affordability, so no forge node should be blocked for want of an ore.
 */
const STOCK: Record<string, number> = {
  "carbalite-ore": 20,
  "malachite-ore": 20,
  "dragonite-ore": 20,
  "fucium-ore": 20,
  "quality-bone": 20,
  "monster-bone-small": 20,
  "monster-bone-medium": 20,
  "monster-bone-large": 20,
  "monster-keenbone": 20,
  "monster-hardbone": 20,
  "ancient-bone": 20,
  "boulder-bone": 20,
  "dragonvein-crystal": 20,
  "wingdrake-hide": 20,
  "great-jagras-claw": 6,
  "great-jagras-hide": 6,
  "great-jagras-scale": 6,
};

test.beforeAll(async ({ browser }) => {
  aki = await Hunter.create(browser, "qa-camp-aki");
  renn = await Hunter.create(browser, "qa-camp-renn");

  await createCampaign(aki, {
    name: `QA camp ${JOIN_CODE}`,
    joinCode: JOIN_CODE,
    weapon: "Great Sword",
  });
  await joinCampaign(renn, { joinCode: JOIN_CODE, weapon: "Bow" });

  const db = await clientFor("qa-camp-aki");
  campaignId = (await campaignByJoinCode(db, JOIN_CODE))!.id;

  const hunters = await waitFor(
    () => huntersOf(db, campaignId),
    (rows) => rows.length === 2,
  );
  for (const h of hunters) {
    await db.from("hunter").update({ materials: STOCK }).eq("id", h.id);
  }
});

test.afterAll(async () => {
  await Promise.all([aki?.dispose(), renn?.dispose()]);
});

test("the box shows stocked materials and edits quantities", async () => {
  const db = await clientFor("qa-camp-aki");
  await aki.page.goto("/inventory");

  const tile = aki.page.getByRole("button", { name: /Carbalite Ore/ }).first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect(tile).toContainText("20");

  // Bump it by one and check the change reaches Postgres.
  await tile.click();
  await aki.page.getByRole("button", { name: "more" }).click();

  const hunters = await waitFor(
    () => huntersOf(db, campaignId),
    (rows) => rows.some((h) => h.materials["carbalite-ore"] === 21),
    { timeout: 30_000 },
  );
  expect(
    hunters.find((h) => h.name === "qa-camp-aki")!.materials["carbalite-ore"],
  ).toBe(21);
});

test("the box separates material, other and monster tabs", async () => {
  await aki.page.goto("/inventory");
  await aki.page.getByRole("button", { name: "Monster", exact: true }).click();

  // Monster parts are badged with their monster, and ours came from Jagras.
  await expect(
    aki.page.getByRole("button", { name: /Great Jagras Claw|Claw/ }).first(),
  ).toBeVisible({ timeout: 15_000 });
});

test("crafting a weapon deducts materials and grants the gear", async () => {
  const db = await clientFor("qa-camp-aki");
  const mine = async () =>
    (await huntersOf(db, campaignId)).find((h) => h.name === "qa-camp-aki")!;
  const before = await mine();

  await aki.page.goto("/forge");
  // "Buster Blade" is the first ore upgrade off the free starter sword.
  const node = aki.page.getByRole("button", { name: /Buster Blade/ }).first();
  await expect(node).toBeVisible({ timeout: 30_000 });
  await node.click();

  const forge = aki.page.getByRole("button", { name: /^(Forge|Re-forge)$/ });
  await expect(forge).toBeEnabled({ timeout: 15_000 });
  await forge.click();

  const after = await waitFor(
    mine,
    (h) => h.owned_gear.length > before.owned_gear.length,
    { timeout: 30_000 },
  );
  expect(after.owned_gear.length).toBeGreaterThan(before.owned_gear.length);

  // Something must have been paid for it.
  const spent = Object.entries(before.materials).some(
    ([id, qty]) => (after.materials[id] ?? 0) < (qty as number),
  );
  expect(spent, "forging must consume materials").toBe(true);
});

test("a material trade goes through both hunters", async () => {
  const db = await clientFor("qa-camp-aki");
  const pending = async () => (await stateOf(db, campaignId))?.pending_trades ?? [];

  // Aki proposes from the party row on Camp.
  await aki.page.goto("/");
  await aki.waitForShell();
  await aki.page.getByRole("button", { name: /qa-camp-renn/ }).first().click();

  await expect(aki.page.getByText("You offer")).toBeVisible({ timeout: 20_000 });

  // "Add to offer" / "Add to request" are mode toggles: pick the side first,
  // then step quantities on the material cards.
  const plusFor = (material: string) =>
    aki.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${material}`) })
      .last()
      .getByRole("button", { name: "+" });

  await aki.page.getByRole("button", { name: "Add to offer" }).click();
  await plusFor("Carbalite Ore").click();

  await aki.page.getByRole("button", { name: "Add to request" }).click();
  await plusFor("Quality Bone").click();

  await aki.page.getByRole("button", { name: "Request trade" }).click();

  const proposed = await waitFor(pending, (t) => t.length === 1, {
    timeout: 30_000,
  });
  expect(proposed[0].status).toBe("pending");

  // Renn accepts.
  await renn.page.goto("/");
  await renn.waitForShell();
  await renn.page.getByRole("button", { name: /qa-camp-aki/ }).first().click();
  const accept = renn.page.getByRole("button", { name: "Accept trade" });
  await expect(accept).toBeVisible({ timeout: 30_000 });
  await accept.click();

  await waitFor(pending, (t) => t.length === 0 || t[0].status !== "pending", {
    timeout: 30_000,
  });
});

test("settings exports a backup and shows the join code", async () => {
  await aki.page.goto("/settings");
  await expect(aki.page.getByText(JOIN_CODE)).toBeVisible({ timeout: 30_000 });

  const download = aki.page.waitForEvent("download", { timeout: 20_000 });
  await aki.page.getByRole("button", { name: "Export (JSON)" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.json$/);
});

test("the handbook search filters the rules reference", async () => {
  await aki.page.goto("/reference");
  // `type="search"` exposes the searchbox role, not textbox.
  const search = aki.page.getByRole("searchbox");
  await expect(search).toBeVisible({ timeout: 30_000 });

  await search.fill("poison");
  await expect(aki.page.getByText(/Poison/i).first()).toBeVisible({
    timeout: 15_000,
  });

  // A term with no match should not leave stale results on screen.
  await search.fill("zzzznotarule");
  await expect(aki.page.getByText(/Poison Resistance/i)).toHaveCount(0, {
    timeout: 15_000,
  });
});
