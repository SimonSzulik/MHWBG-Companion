import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal `.env` reader. The project uses Vite's `envPrefix: ["SUPABASE_"]`, so
 * there is no dotenv dependency to borrow — and adding one just for tests is
 * not worth it. Values here are the public URL + anon key that already ship in
 * the client bundle, so nothing secret is being loaded.
 */
function loadEnvFile(file: string): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(resolve(process.cwd(), file), "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      out[trimmed.slice(0, eq).trim()] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };

function required(name: string): string {
  const value = process.env[name] ?? fileEnv[name];
  if (!value) throw new Error(`Missing ${name} (set it in .env or the environment)`);
  return value;
}

export const SUPABASE_URL = required("SUPABASE_URL");
export const SUPABASE_ANON_KEY = required("SUPABASE_ANON_KEY");

export const BASE_URL = process.env.E2E_BASE_URL ?? "https://project-pth47.vercel.app";

/**
 * `_vercel_share` token for the SSO-protected deployment. Empty is allowed so
 * the suite can also be pointed at an unprotected URL (e.g. localhost).
 */
export const SHARE_TOKEN = process.env.E2E_SHARE_TOKEN ?? "";

/** Every account and campaign the suite creates carries this prefix. */
export const QA_PREFIX = "qa";

/** Shared password for QA accounts; the app requires >= 6 chars. */
export const QA_PASSWORD = "qa-hunter-pw";
