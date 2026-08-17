import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { makeJoinCode } from "./helpers/flows";
import { campaignByJoinCode, clientFor, waitFor } from "./helpers/db";

/** Unticking a box — the path boxes.spec.ts never exercised. */
test.describe.configure({ mode: "serial" });

const CODE = makeJoinCode();
let h: Hunter;
const alerts: string[] = [];

test.beforeAll(async ({ browser }) => {
  h = await Hunter.create(browser, "qa-untick");
  h.page.on("dialog", (d) => { alerts.push(d.message()); void d.dismiss(); });

  await h.page.goto("/onboarding/new");
  await h.page.getByLabel("Campaign name").fill(`QA untick ${CODE}`);
  await h.page.getByLabel("Join code").fill(CODE);
  // Own everything, then take a Hunter's Arsenal weapon.
  await h.page.getByRole("button", { name: "Box: Wildspire Waste" }).click();
  await h.page.getByRole("button", { name: "Box: Hunter's Arsenal" }).click();
  await h.page.getByRole("button", { name: /Hunting Horn/ }).first().click();
  await h.page.getByRole("button", { name: "Off to the hunt!" }).click();
  await expect(h.page.getByText("Share this join code:")).toBeVisible({ timeout: 45_000 });
  await h.page.getByRole("button", { name: "To Camp" }).click();
  await h.waitForShell();
});

test.afterAll(async () => { await h?.dispose(); });

test("unticking a box the party can spare works", async () => {
  const db = await clientFor("qa-untick");
  await h.page.goto("/settings");
  await h.page.getByRole("button", { name: "Box: Wildspire Waste" }).click();

  const c = await waitFor(
    () => campaignByJoinCode(db, CODE),
    (c) => !(c!.boxes as string[]).includes("wildspire-waste"),
    { timeout: 30_000 },
  );
  expect(c!.boxes).not.toContain("wildspire-waste");
});

test("unticking a box a hunter's weapon needs is refused, visibly", async () => {
  const db = await clientFor("qa-untick");
  alerts.length = 0;
  await h.page.goto("/settings");
  await h.page.getByRole("button", { name: "Box: Hunter's Arsenal" }).click();
  await h.page.waitForTimeout(2500);

  // The refusal must be explained, not silent.
  expect(alerts.join(" "), "refusal must be surfaced to the player").toMatch(/weapon/i);

  // …and the box must still be owned.
  const c = await campaignByJoinCode(db, CODE);
  expect(c!.boxes).toContain("hunters-arsenal");

  // …and the checkbox must not look unticked when it was not applied.
  await expect(
    h.page.getByRole("button", { name: "Box: Hunter's Arsenal" }),
  ).toHaveAttribute("aria-pressed", "true");
});
