import { expect, test } from "@playwright/test";
import { makeGrave, mockGraveInsert, mockLoginSuccess } from "./mocks/supabase";

test("creates a grave and redirects to its public page", async ({ page }) => {
  await mockLoginSuccess(page);
  await page.route("**/rest/v1/graves*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Log in first since /graves/new is a protected route.
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);

  const grave = makeGrave({ name: "Smoke Test Project" });
  await mockGraveInsert(page, grave);
  await page.route("**/rest/v1/graves*", async (route) => {
    const url = route.request().url();
    if (
      route.request().method() !== "GET" ||
      !url.includes(`public_slug=eq.${grave.public_slug}`)
    ) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([grave]),
    });
  });

  await page.goto("graves/new");
  await page.getByLabel("Project name").fill(grave.name);
  await page.getByRole("button", { name: /bury the project/i }).click();

  await expect(page).toHaveURL(new RegExp(`/graves/${grave.public_slug}$`));
  await expect(
    page.getByRole("heading", { name: grave.name }),
  ).toBeVisible();
});
