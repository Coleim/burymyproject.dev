import { defineConfig, devices } from "@playwright/test";

// Opt-in cross-browser check (`npm run test:e2e:cross-browser`). Chromium alone
// hides real differences: e.g. it restores the scroll position after Back on
// its own, while Firefox and WebKit (Safari) do not for content loaded late.
// Needs: npx playwright install firefox webkit
const baseURL = "http://localhost:4300/burymyproject.dev/";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /cemetery-navigation\.spec\.ts/,
  fullyParallel: true,
  reporter: "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], baseURL } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], baseURL } },
    { name: "webkit", use: { ...devices["Desktop Safari"], baseURL } },
  ],
  webServer: {
    command: "npm run dev -- --port 4300 --strictPort",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
