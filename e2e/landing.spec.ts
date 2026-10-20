import { expect, test } from "@playwright/test";
import { makeGrave, mockGravesList, mockHomeStats } from "./mocks/supabase";

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

  test("shows the stats returned by the home_stats function", async ({ page }) => {
    await mockGravesList(page, []);
    // Registered last, so it takes precedence over the stats mockGravesList adds.
    await mockHomeStats(page, {
      total_graves: 3,
      developers: 2,
      top_cause: "Scope Creep",
    });

    await page.goto("/");

    await expect(page.getByTestId("stat-total-graves")).toHaveText("3");
    await expect(page.getByTestId("stat-developers")).toHaveText("2");
    await expect(page.getByTestId("stat-top-cause")).toHaveText(
      "Scope Creep",
    );
  });

  test("stats are not computed in the browser from a list of graves", async ({ page }) => {
    const rowRequests: string[] = [];
    await mockGravesList(page, [makeGrave({ id: "1" })]);
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.pathname.endsWith("/rest/v1/graves") && url.searchParams.get("select") === "author_id,cause") {
        rowRequests.push(req.url());
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("stat-total-graves")).toBeVisible();

    expect(rowRequests).toEqual([]);
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
