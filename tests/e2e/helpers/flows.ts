import { expect } from "@playwright/test";
import type { Hunter } from "./hunter";

/** 8-char `[A-Z0-9]` join code, as `isValidJoinCode` requires. */
export function makeJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "QA";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createCampaign(
  hunter: Hunter,
  opts: { name: string; joinCode: string; weapon: string },
): Promise<void> {
  await hunter.page.goto("/onboarding/new");
  await hunter.page.getByLabel("Campaign name").fill(opts.name);
  await hunter.page.getByLabel("Join code").fill(opts.joinCode);
  await pickWeapon(hunter, opts.weapon);

  await hunter.page.getByRole("button", { name: "Off to the hunt!" }).click();
  await expect(hunter.page.getByText("Share this join code:")).toBeVisible({
    timeout: 45_000,
  });
  await expect(hunter.page.getByText(opts.joinCode, { exact: true })).toBeVisible();
  await hunter.page.getByRole("button", { name: "To Camp" }).click();
  await hunter.waitForShell();
}

export async function joinCampaign(
  hunter: Hunter,
  opts: { joinCode: string; weapon: string },
): Promise<void> {
  await hunter.page.goto("/onboarding/join");
  await hunter.page.getByLabel("Join code").fill(opts.joinCode);
  await hunter.page.getByRole("button", { name: "Next" }).click();

  // "Weapon" appears in both the screen header and the picker caption, so scope
  // the wait to the weapon tile itself.
  await expect(
    hunter.page.getByRole("button", { name: opts.weapon, exact: false }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await pickWeapon(hunter, opts.weapon);
  await hunter.page.getByRole("button", { name: "Join", exact: true }).click();
  await hunter.waitForShell();
}

/** Weapon tiles are buttons whose accessible name is the weapon type. */
export async function pickWeapon(hunter: Hunter, weapon: string): Promise<void> {
  await hunter.page.getByRole("button", { name: weapon, exact: false }).first().click();
}

/** Bottom-nav tabs: Settings, Box, Camp, Forge, Info. */
export async function tab(hunter: Hunter, name: string): Promise<void> {
  await hunter.page.getByRole("link", { name }).click();
}
