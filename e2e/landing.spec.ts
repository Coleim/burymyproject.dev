import { expect, test } from "@playwright/test";
import { makeGrave } from "./mocks/supabase";

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

  test("shows real stats computed from Supabase data", async ({ page }) => {
    const graves = [
      makeGrave({ id: "1", author_id: "user-1", cause: "Scope Creep" }),
      makeGrave({ id: "2", author_id: "user-1", cause: "Scope Creep" }),
      makeGrave({ id: "3", author_id: "user-2", cause: "Lost Interest" }),
    ];

    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(graves),
      });
    });

    await page.goto("/");

    await expect(page.getByTestId("stat-total-graves")).toHaveText("3");
    await expect(page.getByTestId("stat-developers")).toHaveText("2");
    await expect(page.getByTestId("stat-top-cause")).toHaveText(
      "Scope Creep",
    );
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hides nav actions until the menu button is opened", async ({ page }) => {
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.goto("");

    const logIn = page.getByRole("link", { name: /^log in$/i });
    await expect(logIn).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(logIn).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(logIn).toBeHidden();
  });
});
