import { expect, test } from "@playwright/test";

test.describe("404 handling", () => {
  test("shows a themed 404 page for an unknown route", async ({ page }) => {
    await page.goto("this-route-does-not-exist");

    await expect(
      page.getByRole("heading", { name: /this page doesn't exist/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /back home/i })).toBeVisible();
  });

  test("shows a themed 404 for an unknown grave slug", async ({ page }) => {
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("graves/does-not-exist");

    await expect(
      page.getByRole("heading", { name: /this grave doesn't exist/i }),
    ).toBeVisible();
  });
});
