import { expect, test, type Page } from "@playwright/test";
import { makeManyGraves, mockPaginatedGraves } from "./mocks/supabase";

type Seen = { url: URL; prefer: string | undefined };

async function track(page: Page) {
  const seen: Seen[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.pathname.endsWith("/rest/v1/graves") && req.method() === "GET") {
      seen.push({ url, prefer: req.headers()["prefer"] });
    }
  });
  return seen;
}

const wantsCount = (r: Seen) => /count=exact/.test(r.prefer ?? "");

test.describe("Cemetery: requests", () => {
  test("only the first page of a search asks for a count", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(200));
    const seen = await track(page);

    await page.goto("cemetery");
    await expect(page.getByText("Showing 24 of 200 graves")).toBeVisible();
    for (const shown of [48, 72, 96]) {
      await page.getByRole("button", { name: "Load more" }).click();
      await expect(page.getByText(`Showing ${shown} of 200 graves`)).toBeVisible();
    }

    const loadMore = seen.filter((r) => r.url.searchParams.get("offset") !== "0");
    expect(loadMore.length).toBe(3);
    expect(loadMore.some(wantsCount)).toBe(false);
    expect(seen.filter((r) => r.url.searchParams.get("offset") === "0").every(wantsCount)).toBe(true);
  });

  test("a short last page ends the list even if the count was stale", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(30));
    await page.goto("cemetery");
    await page.getByRole("button", { name: "Load more" }).click();

    await expect(page.getByText("Showing 30 of 30 graves")).toBeVisible();
    await expect(page.getByRole("button", { name: "Load more" })).toBeHidden();
  });

  test("card images are lazy-loaded, the first screen is not blocked by the rest", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(60));
    await page.goto("cemetery");
    await expect(page.getByText("Showing 24 of 60 graves")).toBeVisible();

    const imgs = page.locator("main img");
    expect(await imgs.count()).toBeGreaterThan(0);
    const attrs = await imgs.evaluateAll((els) =>
      els.map((el) => [el.getAttribute("loading"), el.getAttribute("decoding")]),
    );
    for (const [loading, decoding] of attrs) {
      expect(loading).toBe("lazy");
      expect(decoding).toBe("async");
    }
  });

  test("cards far off-screen skip rendering (content-visibility)", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(60));
    await page.goto("cemetery");
    await expect(page.getByText("Showing 24 of 60 graves")).toBeVisible();

    const cv = await page
      .locator("main a[href*='/graves/project-']")
      .first()
      .evaluate((el) => getComputedStyle(el).contentVisibility);
    expect(cv).toBe("auto");
  });
});

test.describe("Cemetery: URL state", () => {
  test("a search is reflected in the URL and survives a reload", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4000));
    await page.goto("cemetery");

    await page.getByLabel("Search graves").fill("Project 004");
    await expect(page.getByText("Showing 10 of 10 graves")).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=Project(\+|%20)004/);

    await page.reload();
    await expect(page.getByLabel("Search graves")).toHaveValue("Project 004");
    await expect(page.getByText("Showing 10 of 10 graves")).toBeVisible();
  });

  test("loaded pages are written to the URL and restored in ONE request", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4000));
    await page.goto("cemetery");
    await page.getByRole("button", { name: "Load more" }).click();
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 72 of 4000 graves")).toBeVisible();
    await expect(page).toHaveURL(/[?&]pages=3/);

    const seen = await track(page);
    await page.reload();

    await expect(page.getByText("Showing 72 of 4000 graves")).toBeVisible();
    const restoring = seen.filter((r) => r.url.searchParams.get("limit") === "72");
    expect(restoring.length).toBeGreaterThan(0);
    expect(seen.every((r) => r.url.searchParams.get("limit") !== "24")).toBe(true);
  });

  test("a crafted ?pages= cannot request the whole table", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4000));
    const seen = await track(page);
    await page.goto("cemetery?pages=100000");

    await expect(page.getByText("Showing 240 of 4000 graves")).toBeVisible();
    expect(Math.max(...seen.map((r) => Number(r.url.searchParams.get("limit"))))).toBe(240);
  });

  test("clearing the search resets the URL immediately", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(50));
    await page.goto("cemetery?q=zzz-nothing");
    await expect(page.getByText(/No graves match/)).toBeVisible();

    await page.getByRole("button", { name: "Clear search" }).click();

    await expect(page).toHaveURL(/\/cemetery$/);
    await expect(page.getByLabel("Search graves")).toHaveValue("");
    await expect(page.getByText("Showing 24 of 50 graves")).toBeVisible();
  });

  test("following the Cemetery nav link resets a search that was in progress", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(50));
    await page.goto("cemetery?q=Project%200001");
    await expect(page.getByText("Showing 1 of 1 graves")).toBeVisible();

    await page.evaluate(() => {
      history.pushState({}, "", "/burymyproject.dev/cemetery");
      dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page.getByLabel("Search graves")).toHaveValue("");
    await expect(page.getByText("Showing 24 of 50 graves")).toBeVisible();
  });
});

test.describe("Cemetery: coming back from a grave", () => {
  test("Back restores the search, the loaded pages and the scroll position", async ({ page }) => {
    // A slow network on the way back: the browser's own scroll restoration runs
    // before the cards exist and gives up, so this tests our code.
    const delay = { ms: 0 };
    await mockPaginatedGraves(page, makeManyGraves(4000), { delay });
    await page.goto("cemetery");
    await page.getByRole("button", { name: "Load more" }).click();
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 72 of 4000 graves")).toBeVisible();

    const card = page.locator("main a[href*='/graves/project-']").nth(30);
    const href = (await card.getAttribute("href"))!;
    await card.scrollIntoViewIfNeeded(); // clicking would scroll it into view anyway
    await page.waitForTimeout(250); // the position is saved on the next animation frame
    const scrolledTo = await page.evaluate(() => window.scrollY);
    expect(scrolledTo).toBeGreaterThan(500);

    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    delay.ms = 2500;
    await page.goBack();

    await expect(page.getByText("Showing 72 of 4000 graves")).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolledTo - 150);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(scrolledTo + 150);
  });

  test("Back keeps the search term", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4000));
    await page.goto("cemetery");
    await page.getByLabel("Search graves").fill("Project 004");
    await expect(page.getByText("Showing 10 of 10 graves")).toBeVisible();

    await page.locator("main a[href*='/graves/project-']").first().click();
    await expect(page).toHaveURL(/\/graves\//);
    await page.goBack();

    await expect(page.getByLabel("Search graves")).toHaveValue("Project 004");
    await expect(page.getByText("Showing 10 of 10 graves")).toBeVisible();
  });

  test("a fresh visit (not Back) starts at the top", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(100));
    await page.goto("cemetery");
    await page.getByRole("button", { name: "Load more" }).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);

    await page.goto("");
    await page.getByRole("link", { name: /see the full graveyard/i }).click();

    await expect(page).toHaveURL(/\/cemetery$/);
    await expect(page.getByText("Showing 24 of 100 graves")).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });
});
