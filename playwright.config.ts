import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the *deployed* app, not a local dev server.
 *
 * The Vercel project has SSO protection enabled for all `*.vercel.app` URLs, so
 * `E2E_SHARE_TOKEN` must hold a `_vercel_share` token (created via the Vercel
 * MCP `get_access_to_vercel_url`, valid ~23h). `tests/e2e/fixtures.ts` visits
 * the tokenised URL once per context to plant the bypass cookie.
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://project-pth47.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  // Hunters in one campaign mutate shared server state, so specs must not
  // interleave. Parallelism inside a spec comes from multiple browser contexts.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "test-results/html", open: "never" }]],
  use: {
    baseURL,
    ...devices["Pixel 7"],
    // Deterministic viewport for README screenshots.
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
    // The production build ships a service worker. Blocking it keeps runs
    // deterministic; the PWA spec opts back in.
    serviceWorkers: "block",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
