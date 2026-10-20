import { expect, test, type Page } from "@playwright/test";
import { makeGrave, makeManyGraves, mockLoginSuccess, mockPaginatedGraves } from "./mocks/supabase";

const WIDTHS = [320, 375, 768, 1024, 1440];

async function overflowingElements(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad: string[] = [];
    if (document.documentElement.scrollWidth > vw) bad.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== "fixed") {
        const cs = getComputedStyle(el);
        // elements clipped or scrolled by an ancestor are fine
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) {
          const o = getComputedStyle(p);
          if (o.overflowX !== "visible") { clipped = true; break; }
          p = p.parentElement;
        }
        if (!clipped && cs.display !== "none") bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} right=${Math.round(r.right)}`);
      }
    }
    return bad.slice(0, 5);
  });
}

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await mockPaginatedGraves(page, [makeGrave({ public_slug: "rs-1", name: "A Really Long Project Name That Keeps Going", project_url: "https://github.com/some-organisation/some-very-long-repository-name-that-goes-on" }), ...makeManyGraves(6)]);
    await mockLoginSuccess(page);
    await page.goto("login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password1234");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/my-graves$/);

    for (const path of ["", "cemetery", "graves/rs-1", "graves/rs-1/edit", "graves/new", "my-graves", "privacy", "terms", "login", "signup", "nope"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await overflowingElements(page), `${path || "/"} at ${width}px`).toEqual([]);
    }
  });
}
