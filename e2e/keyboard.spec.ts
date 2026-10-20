import { expect, test } from "@playwright/test";
import { makeGrave, makeManyGraves, mockPaginatedGraves } from "./mocks/supabase";

test.describe("Keyboard navigation", () => {
  test("the skip link is the first tab stop and moves focus to the main content", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(3));
    await page.goto("cemetery");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main-content")).toBeFocused();
  });

  test("every page has exactly one main landmark and one h1", async ({ page }) => {
    await mockPaginatedGraves(page, [makeGrave({ public_slug: "kb-1" }), ...makeManyGraves(2)]);
    for (const path of ["", "cemetery", "graves/kb-1", "login", "signup", "privacy", "terms", "nope"]) {
      await page.goto(path);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });

  test("every tab stop shows a visible focus indicator", async ({ page }) => {
    await mockPaginatedGraves(page, makeManyGraves(4));
    for (const path of ["", "cemetery", "login", "signup"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        const state = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          // Native sub-controls (e.g. a date picker button) draw their own ring.
          if (!el.matches(":focus-visible")) return null;
          const cs = getComputedStyle(el);
          const visible =
            (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
            cs.boxShadow !== "none";
          return { visible, name: el.getAttribute("aria-label") || el.innerText.slice(0, 30) };
        });
        if (state) expect(state.visible, `${path || "/"}: "${state.name}" has no focus indicator`).toBe(true);
      }
    }
  });

  test.describe("mobile menu", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("opens with the keyboard, and Escape closes it and returns focus to the toggle", async ({ page }) => {
      await mockPaginatedGraves(page, []);
      await page.goto("");

      const toggle = page.getByRole("button", { name: "Open menu" });
      await page.keyboard.press("Tab"); // skip link
      await page.keyboard.press("Tab"); // logo link
      await page.keyboard.press("Tab"); // menu toggle
      await expect(toggle).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /^log in$/i })).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
      await expect(page.getByRole("link", { name: /^log in$/i })).toBeHidden();
    });
  });
});

test("respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockPaginatedGraves(page, makeManyGraves(2));
  await page.goto("cemetery");

  const durations = await page.evaluate(() =>
    [...document.querySelectorAll("a, button, img, div")]
      .slice(0, 60)
      .map((el) => parseFloat(getComputedStyle(el).animationDuration) || 0),
  );
  expect(Math.max(...durations)).toBeLessThan(0.01);
});
