import { expect, test } from "@playwright/test";
import { makeGrave, mockGravesList } from "./mocks/supabase";

test.describe("SEO and social metadata", () => {
  test("landing exposes description, canonical and Open Graph tags", async ({ page }) => {
    await mockGravesList(page, []);
    await page.goto("");

    const meta = (selector: string) =>
      page.locator(selector).first().getAttribute("content");

    expect(await meta('meta[name="description"]')).toMatch(/abandoned side projects/i);
    expect(await meta('meta[property="og:title"]')).toContain("burymyproject.dev");
    expect(await meta('meta[property="og:type"]')).toBe("website");
    expect(await meta('meta[property="og:image"]')).toMatch(
      /^https:\/\/.+\/og-image\.jpg$/,
    );
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https:\/\/coleim\.github\.io\/burymyproject\.dev\/$/,
    );
  });

  test("the share image is actually served", async ({ request }) => {
    const res = await request.get("og-image.jpg");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("image/jpeg");
  });

  test("each page sets a meaningful document title", async ({ page }) => {
    const grave = makeGrave({ name: "DevFlow", public_slug: "devflow-1" });
    await mockGravesList(page, [grave]);

    await page.goto("cemetery");
    await expect(page).toHaveTitle("Cemetery · burymyproject.dev");

    await page.goto("graves/devflow-1");
    await expect(page).toHaveTitle("DevFlow — RIP · burymyproject.dev");

    await page.goto("nope/nothing");
    await expect(page).toHaveTitle("Page not found · burymyproject.dev");
  });
});
