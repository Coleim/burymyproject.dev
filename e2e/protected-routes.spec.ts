import { expect, test } from "@playwright/test";
import { mockLoginSuccess } from "./mocks/supabase";

test.describe("Protected routes", () => {
  test("redirects to /login with redirectTo when visiting /my-graves logged out", async ({
    page,
  }) => {
    await page.goto("my-graves");

    await expect(page).toHaveURL(/login\?redirectTo=%2Fmy-graves/);
  });

  test("redirects back to the original page after logging in", async ({
    page,
  }) => {
    await mockLoginSuccess(page);
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("my-graves");
    await expect(page).toHaveURL(/login\?redirectTo=%2Fmy-graves/);

    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password1234");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/my-graves$/);
  });

  test("redirects to /login when visiting /graves/new logged out", async ({
    page,
  }) => {
    await page.goto("graves/new");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fgraves%2Fnew/);
  });
});
