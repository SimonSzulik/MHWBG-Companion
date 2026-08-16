import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

const DIR = resolve(process.cwd(), "docs/screenshots");

/**
 * Screenshot into `docs/screenshots/`. Used both for failure evidence in the QA
 * report and, unchanged, for the README screenshots — same viewport, same
 * device scale, so the two never drift apart.
 */
export async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(DIR, { recursive: true });
  const path = resolve(DIR, `${name}.png`);
  // Settle animations and lazily-loaded artwork before capturing.
  await page.waitForTimeout(400);
  await page.screenshot({ path, animations: "disabled" });
  return path;
}
