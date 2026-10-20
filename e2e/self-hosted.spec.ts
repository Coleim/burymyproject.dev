import { expect, test } from "@playwright/test";
import { makeGrave, mockPaginatedGraves } from "./mocks/supabase";

test.describe("Self-hosted assets", () => {
  test("no page contacts Google Fonts or any third-party font/style host", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (req) => {
      const { hostname } = new URL(req.url());
      if (/(^|\.)(googleapis|gstatic)\.com$/.test(hostname)) external.push(req.url());
    });
    await mockPaginatedGraves(page, [makeGrave({ public_slug: "sh-1" })]);

    for (const path of ["", "cemetery", "graves/sh-1", "login", "privacy", "terms", "nope"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }

    expect(external).toEqual([]);
  });

  test("Cinzel really renders from the self-hosted file", async ({ page }) => {
    const fontResponses: string[] = [];
    page.on("response", (res) => {
      if (/\.woff2(\?|$)/.test(res.url())) fontResponses.push(new URL(res.url()).origin);
    });
    await mockPaginatedGraves(page, []);
    await page.goto("");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    const loaded = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => f.family.replace(/"/g, "")),
    );
    expect(loaded).toContain("Cinzel");
    expect(fontResponses.length).toBeGreaterThan(0);
    for (const origin of fontResponses) expect(origin).toBe(new URL(page.url()).origin);
  });
});
