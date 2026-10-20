import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

// Tests need the Supabase URL (e.g. to seed a session in localStorage); vite
// reads it from .env.local, Playwright does not. CI already has it in the env.
Object.assign(process.env, {
  ...loadEnv("", process.cwd(), "VITE_"),
  ...Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith("VITE_")),
  ),
});

const BASE_PATH = "/burymyproject.dev/";
const DEV_PORT = 4300;
const PREVIEW_PORT = 4301;
const devURL = `http://localhost:${DEV_PORT}${BASE_PATH}`;
const previewURL = `http://localhost:${PREVIEW_PORT}${BASE_PATH}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /(csp|oauth-only)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: devURL },
    },
    {
      // The Content-Security-Policy only exists in production builds.
      name: "production-build",
      testMatch: /(csp|oauth-only)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: previewURL },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
      // The dev server runs with the email form on: most tests log in through it.
      env: { VITE_AUTH_EMAIL_ENABLED: "true" },
      url: devURL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // No sitemap step: it would page through the real database on every run.
      command: `npx tsc -b && npx vite build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      // The production default: OAuth-only.
      env: { VITE_AUTH_EMAIL_ENABLED: "false" },
      url: previewURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
