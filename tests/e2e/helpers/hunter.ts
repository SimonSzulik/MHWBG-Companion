import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BASE_URL, QA_PASSWORD, SHARE_TOKEN } from "./env";

/**
 * One signed-in hunter, in its own browser context.
 *
 * Contexts are fully isolated (own cookies, own localStorage, own Supabase
 * session), which is what lets a single spec drive three players against one
 * campaign at the same time — the only way to exercise the lobby, invites,
 * trading and the "all hunters must confirm" downtime gate.
 */
export class Hunter {
  constructor(
    readonly name: string,
    readonly context: BrowserContext,
    readonly page: Page,
  ) {}

  static async create(browser: Browser, name: string): Promise<Hunter> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await plantBypassCookie(page);
    const hunter = new Hunter(name, context, page);
    await hunter.authenticate();
    return hunter;
  }

  /**
   * Sign up; fall back to sign-in so the suite is re-runnable.
   *
   * Retried once: with several specs running back to back the auth endpoint
   * occasionally refuses a request, and a bare failure here reads like a
   * product bug in whichever spec happened to run next.
   */
  private async authenticate(): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await this.attemptAuth();
        return;
      } catch (err) {
        if (attempt >= 2) throw err;
        await this.page.waitForTimeout(2_000);
      }
    }
  }

  private async attemptAuth(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "MHWBG Companion" })).toBeVisible();

    await this.page.getByRole("button", { name: "Create account" }).click();
    await this.page.getByLabel("Hunter name").fill(this.name);
    await this.page.getByLabel("Password", { exact: true }).fill(QA_PASSWORD);
    await this.page.getByLabel("Repeat password").fill(QA_PASSWORD);
    await this.page.getByRole("button", { name: "Create account" }).last().click();

    if (await this.reachedOnboarding()) return;

    // Already registered from a previous run — sign in instead.
    await this.page.getByRole("button", { name: "Login" }).click();
    await this.page.getByLabel("Hunter name").fill(this.name);
    await this.page.getByLabel("Password", { exact: true }).fill(QA_PASSWORD);
    await this.page.getByRole("button", { name: "Sign in" }).click();

    await expect(this.page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
  }

  private async reachedOnboarding(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/onboarding/, { timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Wait out the OnlineGate — the shell refuses to render until sync is live. */
  async waitForShell(): Promise<void> {
    await expect(
      this.page.getByText(/Offline|Verbinde|Sync-Fehler/i),
    ).toHaveCount(0, { timeout: 45_000 });
  }

  async dispose(): Promise<void> {
    await this.context.close();
  }
}

/**
 * The deployment is SSO-protected, so the first navigation must carry the
 * `_vercel_share` token; Vercel answers with a cookie the context then reuses.
 */
export async function plantBypassCookie(page: Page): Promise<void> {
  if (!SHARE_TOKEN) return;
  const res = await page.goto(`${BASE_URL}/?_vercel_share=${SHARE_TOKEN}`);
  if (res && res.status() >= 400) {
    throw new Error(
      `Share token rejected (HTTP ${res.status()}). Mint a fresh one — they expire after ~23h.`,
    );
  }
}
