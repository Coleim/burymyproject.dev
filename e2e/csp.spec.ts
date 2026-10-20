import { expect, test } from "@playwright/test";
import {
  makeGrave,
  makeManyGraves,
  seedSession,
  mockPaginatedGraves,
} from "./mocks/supabase";

// Runs against the production build (see playwright.config.ts): the dev
// server has no Content-Security-Policy.
test.describe("Content-Security-Policy (production build)", () => {
  test("ships a strict policy without unsafe-inline/unsafe-eval scripts", async ({ page }) => {
    await page.goto("");
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");

    expect(policy).toBeTruthy();
    const directive = (name: string) =>
      policy!.split(";").map((d) => d.trim()).find((d) => d.startsWith(name + " "));

    expect(directive("script-src")).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(directive("script-src")).toMatch(/'self'/);
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("default-src")).toBe("default-src 'self'");
    // Everything is self-hosted: no third-party style or font origin is trusted.
    expect(directive("style-src")).toBe("style-src 'self'");
    expect(directive("font-src")).toBe("font-src 'self'");
    expect(policy).not.toMatch(/googleapis|gstatic/);
  });

  test("no page triggers a CSP violation", async ({ page }) => {
    const grave = makeGrave({ public_slug: "csp-1", project_url: "https://github.com/me/x" });
    await mockPaginatedGraves(page, [grave, ...makeManyGraves(5)]);
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { __csp: string[] }).__csp.push(
          `${e.violatedDirective} blocked ${e.blockedURI}`,
        );
      });
    });

    const violations: string[] = [];
    const collect = async () =>
      violations.push(
        ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
      );

    for (const path of ["", "cemetery", "graves/csp-1", "login", "signup", "privacy", "terms", "nope"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await collect();
    }

    // Client-side validation (zod, jitless) and a signed-in flow also run under the policy.
    await seedSession(page);
    await page.goto("graves/new");
    await page.getByRole("button", { name: /bury the project/i }).click();
    await expect(page.locator("[id$='-error']").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await collect();

    expect(violations).toEqual([]);
  });

  test("the SPA deep-link restore script is allowed by the policy", async ({ page }) => {
    await mockPaginatedGraves(page, [makeGrave({ public_slug: "csp-1" })]);
    // This is the URL public/404.html redirects /graves/csp-1 to on GitHub Pages.
    await page.goto("?/graves/csp-1");
    await expect(page).toHaveURL(/\/burymyproject\.dev\/graves\/csp-1$/);
  });
});
