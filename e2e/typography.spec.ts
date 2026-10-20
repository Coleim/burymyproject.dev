import { expect, test } from "@playwright/test";
import { makeGrave, mockPaginatedGraves } from "./mocks/supabase";

test.describe("Typography", () => {
  test("body text is Inter, headings Cinzel, labels monospace, and nothing falls back to the browser default", async ({ page }) => {
    await mockPaginatedGraves(page, [makeGrave({ public_slug: "ty-1" })]);

    for (const path of ["", "cemetery", "login", "privacy", "terms"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);

      const report = await page.evaluate(() => {
        const family = (el: Element) => getComputedStyle(el).fontFamily;
        const textElements = [...document.body.querySelectorAll("*")].filter((el) =>
          [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()),
        );
        return {
          body: family(document.body),
          h1: family(document.querySelector("h1")!),
          button: family(document.querySelector('nav a[href$="/login"]')!),
          fallbacks: textElements
            .filter((el) => /^"?(Times|Times New Roman|serif)"?$/i.test(family(el).split(",")[0].trim()))
            .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent!.trim().slice(0, 30)}`),
        };
      });

      expect(report.body, `${path || "/"}: body`).toMatch(/^"?Inter"?,/);
      expect(report.h1, `${path || "/"}: h1`).toMatch(/^"?Cinzel"?,/);
      expect(report.button, `${path || "/"}: nav/buttons`).toMatch(/monospace/);
      expect(report.fallbacks, `${path || "/"}: text in the browser's default serif`).toEqual([]);
    }
  });

  test("Inter is actually downloaded from the site, with its italic only when italic text exists", async ({ page }) => {
    const files: string[] = [];
    page.on("response", (res) => {
      // "<name>.woff2" under the dev server, "<name>-<8-char hash>.woff2" once built.
      const m = res.url().match(/\/((?:inter|cinzel)[a-z-]*?)(?:-[A-Za-z0-9_-]{8})?\.woff2/i);
      if (m) files.push(m[1]);
    });
    await mockPaginatedGraves(page, []);
    await page.goto("terms"); // body text, no italics
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    expect(files.some((f) => /^inter-latin$/i.test(f))).toBe(true);
    expect(files.some((f) => /italic/i.test(f))).toBe(false);
    expect(files.some((f) => /latin-ext/i.test(f))).toBe(false);
  });
});
