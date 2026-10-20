import { expect, test } from "@playwright/test";
import { makeGrave, mockFoundingClaimed, mockGravesList, mockPaginatedGraves } from "./mocks/supabase";

const founding = makeGrave({ id: "1", public_slug: "f-1", name: "First Ghost", founding_rank: 1 });
const tenth = makeGrave({ id: "2", public_slug: "f-10", name: "Tenth Ghost", founding_rank: 10, tombstone_bg: "grave_bg_05.webp", tombstone_fg: "grave_08.webp" });
const ordinary = makeGrave({ id: "3", public_slug: "o-1", name: "Ordinary Grave", tombstone_bg: "grave_bg_03.webp", tombstone_fg: "grave_05.webp" });

test.describe("Founding Ghost", () => {
  test("the cemetery shows the badge on founding graves and only on them", async ({ page }) => {
    await mockPaginatedGraves(page, [founding, ordinary, tenth]);
    await page.goto("cemetery");

    await expect(page.getByRole("link", { name: /First Ghost/ })).toContainText("Founding Ghost №1");
    await expect(page.getByRole("link", { name: /Tenth Ghost/ })).toContainText("Founding Ghost №10");
    await expect(page.getByRole("link", { name: /Ordinary Grave/ })).not.toContainText("Founding Ghost");
    await expect(page.getByText(/Founding Ghost/)).toHaveCount(2);
  });

  test("a founding grave's page explains the badge; an ordinary one doesn't", async ({ page }) => {
    await mockPaginatedGraves(page, [founding]);
    await page.goto("graves/f-1");
    await expect(page.getByText(/Founding Ghost №1 of 10: one of the first ten graves/)).toBeVisible();

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await mockPaginatedGraves(page, [ordinary]);
    await page.goto("graves/o-1");
    await expect(page.getByRole("heading", { level: 1, name: "Ordinary Grave" })).toBeVisible();
    await expect(page.getByText(/Founding Ghost/)).toHaveCount(0);
  });

  test("the golden look is really applied: gold frame, tinted artwork, none on ordinary graves", async ({ page }) => {
    await mockPaginatedGraves(page, [founding, ordinary]);
    await page.goto("cemetery");
    await expect(page.getByRole("link", { name: /First Ghost/ })).toBeVisible();

    const look = (name: RegExp) =>
      page.getByRole("link", { name }).evaluate((a) => {
        const image = a.querySelector("[class*='tombstone-image']")!;
        return {
          shadow: getComputedStyle(image).boxShadow,
          filter: getComputedStyle(a.querySelector("[class*='grave-fg']")!).filter,
        };
      });
    const gold = await look(/First Ghost/);
    const plain = await look(/Ordinary Grave/);

    expect(gold.shadow).toMatch(/232, 195, 106/); // the golden frame
    expect(gold.filter).toContain("sepia");
    expect(plain.shadow).toBe("none");
    expect(plain.filter).not.toContain("sepia");
  });

  test("the shine never crosses the text: it sits under the text layer", async ({ page }) => {
    await mockPaginatedGraves(page, [founding]);
    await page.goto("cemetery");
    await expect(page.getByRole("link", { name: /First Ghost/ })).toBeVisible();

    const z = await page.getByRole("link", { name: /First Ghost/ }).evaluate((a) => {
      const image = a.querySelector("[class*='tombstone-image']")!;
      const overlay = a.querySelector("[class*='tombstone-overlay']")!;
      return {
        sheen: Number(getComputedStyle(image, "::after").zIndex),
        text: Number(getComputedStyle(overlay).zIndex),
      };
    });
    expect(z.sheen).toBeLessThan(z.text);
  });

  test("card text is not faded: dates and epitaph stay legible on any artwork", async ({ page }) => {
    await mockPaginatedGraves(page, [founding, ordinary]);
    await page.goto("cemetery");
    await expect(page.getByRole("link", { name: /First Ghost/ })).toBeVisible();

    for (const name of [/First Ghost/, /Ordinary Grave/]) {
      const v = await page.getByRole("link", { name }).evaluate((a) => {
        const op = (sel: string) => Number(getComputedStyle(a.querySelector(sel)!).opacity);
        return {
          dates: op("[class*='tombstone-dates']"),
          epitaph: op("[class*='tombstone-epitaph']"),
          name: op("[class*='tombstone-name']"),
          scrim: getComputedStyle(a.querySelector("[class*='tombstone-overlay']")!).backgroundImage,
          pill: getComputedStyle(a.querySelector("[class*='tombstone-cause']")!).backgroundColor,
        };
      });
      expect(v.dates).toBeGreaterThanOrEqual(0.9);
      expect(v.epitaph).toBeGreaterThanOrEqual(0.9);
      expect(v.name).toBeGreaterThanOrEqual(0.95);
      expect(v.scrim).toContain("gradient"); // a dark scrim behind the text
      expect(Number(v.pill.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1)).toBeGreaterThanOrEqual(0.85);
    }
  });

  test("reduced motion: the shine does not animate", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockPaginatedGraves(page, [founding]);
    await page.goto("cemetery");
    await expect(page.getByRole("link", { name: /First Ghost/ })).toBeVisible();

    const duration = await page.getByRole("link", { name: /First Ghost/ }).evaluate((a) =>
      parseFloat(getComputedStyle(a.querySelector("[class*='tombstone-image']")!, "::after").animationDuration),
    );
    expect(duration).toBeLessThan(0.01);
  });

  for (const width of [320, 375, 768]) {
    test(`the badge fits inside the card at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mockPaginatedGraves(page, [tenth]);
      await page.goto("cemetery");
      const card = page.getByRole("link", { name: /Tenth Ghost/ });
      await expect(card).toBeVisible();

      const badge = (await card.locator("[class*='founding-badge']").boundingBox())!;
      const box = (await card.boundingBox())!;
      expect(badge.x).toBeGreaterThanOrEqual(box.x);
      expect(badge.x + badge.width).toBeLessThanOrEqual(box.x + box.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});

test.describe("Founding Ghost teaser on the home page", () => {
  const teaser = (page: import("@playwright/test").Page) => page.getByTestId("founding-teaser");

  test.beforeEach(async ({ page }) => {
    await mockGravesList(page, []); // stats and graves; each test sets its own count below
  });

  for (const [claimed, text] of [
    [0, "Be the first of 10 Founding Ghosts"],
    [3, "7 of 10 Founding Ghost spots left"],
    [9, "Last Founding Ghost spot!"],
  ] as const) {
    test(`${claimed} claimed says "${text}" and invites to dig a grave`, async ({ page }) => {
      await mockFoundingClaimed(page, claimed);
      await page.goto("");

      await expect(teaser(page)).toContainText(text);
      await expect(teaser(page)).toContainText("Claim yours");
      await expect(teaser(page)).toHaveAttribute("href", /\/graves\/new$/);
    });
  }

  test("once all ten are claimed it says so and is no longer a call to action", async ({ page }) => {
    await mockFoundingClaimed(page, 10);
    await page.goto("");

    await expect(teaser(page)).toContainText("All 10 Founding Ghosts have been claimed");
    await expect(teaser(page)).not.toContainText("Claim yours");
    expect(await teaser(page).evaluate((el) => el.tagName)).toBe("P");
  });

  test("if the count can't be loaded, nothing is shown and the page still works", async ({ page }) => {
    await mockFoundingClaimed(page, "error");
    await page.goto("");

    await expect(page.getByRole("heading", { level: 1, name: /bury your dead projects/i })).toBeVisible();
    await expect(teaser(page)).toHaveCount(0);
  });

  test("a late answer causes no layout shift: the space is reserved", async ({ page }) => {
    await mockFoundingClaimed(page, 4, { delayMs: 900 });
    await page.goto("");

    const stripY = async () => (await page.getByTestId("stat-total-graves").boundingBox())!.y;
    await expect(page.getByTestId("stat-total-graves")).toBeVisible();
    const before = await stripY();
    expect(await teaser(page).count()).toBe(0); // not there yet

    await expect(teaser(page)).toBeVisible();
    const after = await stripY();
    expect(Math.abs(after - before)).toBeLessThan(1);
  });

  test("it fits on a 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await mockFoundingClaimed(page, 0);
    await page.goto("");

    const box = (await teaser(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
