import { expect, test } from "@playwright/test";
import { mockPaginatedGraves } from "./mocks/supabase";

test.describe("session lock", () => {
  test("loading the site raises no uncaught error and holds no browser lock", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockPaginatedGraves(page, []);

    await page.goto("");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1500);

    expect(errors).toEqual([]);
    const locks = await page.evaluate(async () => (await navigator.locks.query()).held);
    expect(locks).toEqual([]);
  });
});
