import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows the hero and navigation", async ({ page }) => {
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /bury your dead projects/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });
});
