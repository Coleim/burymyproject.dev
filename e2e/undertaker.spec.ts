import { expect, test, type Page } from "@playwright/test";
import { makeGrave, mockGravesList, mockLoginSuccess } from "./mocks/supabase";

async function login(page: Page) {
  await mockLoginSuccess(page);
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);
}

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe("Undertaker on 'Dig a new grave'", () => {
  for (const width of [320, 375, 768, 1280]) {
    test(`is decorative, loaded and overlaps nothing at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mockGravesList(page, []);
      await login(page);
      await page.goto("graves/new");

      const undertaker = page.getByTestId("undertaker");
      await expect(undertaker).toBeAttached();
      await expect(undertaker).toHaveAttribute("aria-hidden", "true");
      const img = undertaker.locator("img");
      await expect(img).toHaveAttribute("alt", "");
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);

      const box = (await undertaker.boundingBox())!;
      for (const [name, locator] of [
        ["navigation", page.locator("nav")],
        ["title", page.getByRole("heading", { level: 1 })],
        ["subtitle", page.getByText("Give your abandoned project the send-off it deserves.")],
        ["form", page.locator("#grave-form")],
        ["preview", page.getByTestId("grave-preview")],
      ] as const) {
        const other = (await locator.boundingBox())!;
        expect(overlaps(box, other), `undertaker overlaps the ${name} at ${width}px`).toBe(false);
      }

      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      ).toBe(true);
    });
  }

  test("ships optimized WebP files, not the 2.7 MB source", async ({ page }) => {
    const sizes: Record<string, number> = {};
    page.on("response", async (res) => {
      if (/undertaker.*\.webp/.test(res.url())) sizes[res.url()] = (await res.body()).length;
    });
    await mockGravesList(page, []);
    await login(page);
    await page.goto("graves/new");
    await page.waitForLoadState("networkidle");

    const files = Object.values(sizes);
    expect(files.length).toBeGreaterThan(0);
    for (const size of files) expect(size).toBeLessThan(120_000);
    expect(Object.keys(sizes).some((url) => url.endsWith(".png"))).toBe(false);
  });

  test("is not shown on the edit page", async ({ page }) => {
    const grave = makeGrave({ public_slug: "u-1" });
    await mockGravesList(page, [grave]);
    await login(page);
    await page.goto("graves/u-1/edit");

    await expect(page.getByRole("heading", { name: "Edit this grave" })).toBeVisible();
    await expect(page.getByTestId("undertaker")).toHaveCount(0);
  });
});
