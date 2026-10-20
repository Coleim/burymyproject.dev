import { defineConfig, devices } from "@playwright/test";

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
      testIgnore: /csp\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: devURL },
    },
    {
      // The Content-Security-Policy only exists in production builds.
      name: "production-build",
      testMatch: /csp\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: previewURL },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
      url: devURL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // No sitemap step: it would page through the real database on every run.
      command: `npx tsc -b && npx vite build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      url: previewURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
