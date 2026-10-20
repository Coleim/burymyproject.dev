import { expect, test } from "@playwright/test";
import { mockPaginatedGraves } from "./mocks/supabase";

// Runs against the production build (see playwright.config.ts). These guard
// the mobile loading work: a 377 KB PNG logo and a 168 KB background sent to
// phones were the heaviest requests on every page.
test.describe("Loading performance (production build)", () => {
  test("the head preloads the two fonts every page needs and connects to Supabase early", async ({ page }) => {
    await page.goto("");

    const preloads = await page.locator('link[rel="preload"][as="font"]').evaluateAll((els) =>
      els.map((el) => ({ href: (el as HTMLLinkElement).href, crossorigin: el.hasAttribute("crossorigin"), type: el.getAttribute("type") })),
    );
    expect(preloads.map((p) => p.href).join(" ")).toMatch(/inter-latin-\w+\.woff2/);
    expect(preloads.map((p) => p.href).join(" ")).toMatch(/cinzel-latin-\w+\.woff2/);
    for (const p of preloads) {
      expect(p.crossorigin).toBe(true); // fonts are fetched in CORS mode: without it the preload is wasted
      expect(p.type).toBe("font/woff2");
      expect(new URL(p.href).origin).toBe(new URL(page.url()).origin);
    }

    const preconnect = await page.locator('link[rel="preconnect"]').evaluateAll((els) => els.map((el) => (el as HTMLLinkElement).href));
    expect(preconnect.some((h) => /\.supabase\.co/.test(h))).toBe(true);
  });

  test("phones are not sent the 4k background, desktops are", async ({ page }) => {
    const images: { url: string; size: number }[] = [];
    const reads: Promise<void>[] = []; // bodies are read before the next navigation, or they vanish
    page.on("response", (res) => {
      if (/\.(webp|png|jpe?g)(\?|$)/.test(res.url())) {
        reads.push(res.body().then((b) => void images.push({ url: res.url(), size: b.length })).catch(() => {}));
      }
    });
    await mockPaginatedGraves(page, []);

    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("");
    await page.waitForLoadState("networkidle");
    await Promise.all(reads);
    expect(images.some((i) => /bg-home-1280/.test(i.url))).toBe(true);
    expect(images.some((i) => /bg-home-4k/.test(i.url))).toBe(false);
    expect(images.reduce((sum, i) => sum + i.size, 0)).toBeLessThan(80_000);

    images.length = 0;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("");
    await page.waitForLoadState("networkidle");
    await Promise.all(reads);
    expect(images.some((i) => /bg-home-4k/.test(i.url))).toBe(true);
  });

  test("the logo is a few KB and has explicit dimensions (no layout shift)", async ({ page }) => {
    const sizes: Record<string, number> = {};
    const reads: Promise<void>[] = [];
    page.on("response", (res) => {
      if (/grave-logo/.test(res.url())) reads.push(res.body().then((b) => void (sizes[res.url()] = b.length)).catch(() => {}));
    });
    await mockPaginatedGraves(page, []);
    await page.goto("");
    await page.waitForLoadState("networkidle");
    await Promise.all(reads);

    const files = Object.entries(sizes);
    expect(files.length).toBeGreaterThan(0);
    for (const [url, size] of files) {
      expect(url, "logo must not be the old PNG").not.toMatch(/\.png/);
      expect(size).toBeLessThan(20_000);
    }
    for (const img of await page.locator('img[src*="grave-logo"]').all()) {
      expect(await img.getAttribute("width")).toBeTruthy();
      expect(await img.getAttribute("height")).toBeTruthy();
    }
  });

  test("no image bigger than 200 KB is loaded on the pages people land on", async ({ page }) => {
    const big: string[] = [];
    const reads: Promise<void>[] = [];
    page.on("response", (res) => {
      if (/\.(webp|png|jpe?g)(\?|$)/.test(res.url())) {
        reads.push(res.body().then((b) => { if (b.length > 200_000) big.push(res.url()); }).catch(() => {}));
      }
    });
    await mockPaginatedGraves(page, []);
    for (const path of ["", "cemetery", "login", "terms"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await Promise.all(reads);
    }
    expect(big).toEqual([]);
  });
});
