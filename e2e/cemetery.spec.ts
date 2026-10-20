import { expect, test } from "@playwright/test";
import { makeManyGraves, mockPaginatedGraves } from "./mocks/supabase";

test.describe("Cemetery pagination", () => {
  test("loads graves page by page from a 4000-grave cemetery", async ({
    page,
  }) => {
    const all = makeManyGraves(4000);
    await mockPaginatedGraves(page, all);
    await page.goto("cemetery");

    await expect(page.getByText("Showing 24 of 4000 graves")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Project 0001" })).toBeVisible();

    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 48 of 4000 graves")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Project 0048" })).toBeVisible();

    // No duplicates after loading a second page.
    const names = await page.getByRole("heading", { level: 4 }).allInnerTexts();
    expect(names).toHaveLength(48);
    expect(new Set(names).size).toBe(48);
  });

  test("hides the Load more button once everything is loaded", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(30));
    await page.goto("cemetery");

    await expect(page.getByText("Showing 24 of 30 graves")).toBeVisible();
    await page.getByRole("button", { name: "Load more" }).click();

    await expect(page.getByText("Showing 30 of 30 graves")).toBeVisible();
    await expect(page.getByRole("button", { name: "Load more" })).toBeHidden();
  });

  test("shows an error and lets the user retry when loading more fails", async ({
    page,
  }) => {
    await mockPaginatedGraves(page, makeManyGraves(60), { failOffsets: [24] });
    await page.goto("cemetery");

    await expect(page.getByText("Showing 24 of 60 graves")).toBeVisible();
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByRole("alert")).toContainText("Couldn't load more");

    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 48 of 60 graves")).toBeVisible();
    await expect(page.getByRole("alert")).toBeHidden();
  });

  test("shows the empty state when there are no graves", async ({ page }) => {
    await mockPaginatedGraves(page, []);
    await page.goto("cemetery");

    await expect(page.getByText(/cemetery is still empty/i)).toBeVisible();
  });
});

test.describe("Cemetery search", () => {
  test("filters graves by name and resets pagination", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4000));
    await page.goto("cemetery");
    await expect(page.getByText("Showing 24 of 4000 graves")).toBeVisible();

    await page.getByLabel("Search graves").fill("Project 004");

    // "Project 004" matches 0040..0049 only.
    await expect(page.getByText("Showing 10 of 10 graves")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Project 0045" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Project 0001" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Load more" })).toBeHidden();
  });

  test("is case-insensitive", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(50));
    await page.goto("cemetery");

    await page.getByLabel("Search graves").fill("PROJECT 0007");
    await expect(page.getByText("Showing 1 of 1 graves")).toBeVisible();
  });

  test("shows a no-results state and can clear the search", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(50));
    await page.goto("cemetery");

    await page.getByLabel("Search graves").fill("zzz-nothing");
    await expect(page.getByText(/No graves match/)).toBeVisible();

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByText("Showing 24 of 50 graves")).toBeVisible();
    await expect(page.getByLabel("Search graves")).toHaveValue("");
  });

  test("treats % and _ as literal characters", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(50));
    await page.goto("cemetery");

    await page.getByLabel("Search graves").fill("%");
    await expect(page.getByText(/No graves match/)).toBeVisible();
  });
});
