import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { makeGrave, makeManyGraves, mockLoginSuccess, mockPaginatedGraves } from "./mocks/supabase";

async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    count: v.nodes.length,
  }));
}

async function login(page: Page) {
  await mockLoginSuccess(page);
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 812 },
]) {
  test.describe(`axe — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("public pages", async ({ page }) => {
      const grave = makeGrave({ public_slug: "a11y-1", project_url: "https://github.com/me/x", founding_rank: 1 });
      await mockPaginatedGraves(page, [grave, ...makeManyGraves(5)]);
      const report: Record<string, unknown> = {};
      for (const path of ["", "cemetery", "graves/a11y-1", "login", "signup", "privacy", "terms", "nope"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        report[path || "/"] = await scan(page);
      }
      expect(report).toEqual(Object.fromEntries(Object.keys(report).map((k) => [k, []])));
    });

    test("authenticated pages", async ({ page }) => {
      const grave = makeGrave({ public_slug: "a11y-1" });
      await mockPaginatedGraves(page, [grave]);
      await login(page);
      const report: Record<string, unknown> = {};
      for (const path of ["my-graves", "graves/new", "graves/a11y-1/edit"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        report[path] = await scan(page);
      }
      expect(report).toEqual(Object.fromEntries(Object.keys(report).map((k) => [k, []])));
    });
  });
}
