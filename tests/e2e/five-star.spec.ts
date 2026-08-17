import { expect, test } from "@playwright/test";
import { Hunter } from "./helpers/hunter";
import { makeJoinCode } from "./helpers/flows";
import { shot } from "./helpers/shot";

/** An elder dragon box adds a 5★ tier the app previously could not express. */
test("owning Nergigante shows a 5-star tempered tier", async ({ browser }) => {
  const code = makeJoinCode();
  const h = await Hunter.create(browser, "qa-five-aki");

  await h.page.goto("/onboarding/new");
  await h.page.getByLabel("Campaign name").fill(`QA five ${code}`);
  await h.page.getByLabel("Join code").fill(code);
  await h.page.getByRole("button", { name: "Box: Nergigante" }).click();
  await h.page.getByRole("button", { name: /Great Sword/ }).first().click();
  await h.page.getByRole("button", { name: "Off to the hunt!" }).click();
  await expect(h.page.getByText("Share this join code:")).toBeVisible({
    timeout: 45_000,
  });
  await h.page.getByRole("button", { name: "To Camp" }).click();
  await h.waitForShell();

  await h.page.goto("/campaign/quests");
  await expect(h.page.getByText("Quest Board")).toBeVisible({ timeout: 30_000 });
  await expect(h.page.getByText("★★★★★")).toBeVisible();
  await expect(
    h.page.getByRole("button", { name: /Nergigante/ }).first(),
  ).toBeVisible();
  await shot(h.page, "readme-five-star");

  await h.dispose();
});
