import { expect, test, type Page } from "@playwright/test";
import { makeGrave, mockGravesList, mockLoginSuccess } from "./mocks/supabase";

async function login(page: Page) {
  await mockLoginSuccess(page);
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);
}

test.describe("Terms of Service", () => {
  test("is reachable from the footer, the sign-in page and the privacy policy", async ({ page }) => {
    await mockGravesList(page, []);
    await page.goto("");
    await page.getByRole("contentinfo").getByRole("link", { name: "Terms" }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
    await expect(page).toHaveTitle(/Terms/);

    await page.goto("login");
    await expect(page.getByText(/by continuing you agree/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", /\/terms$/);
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", /\/privacy$/);

    await page.goto("privacy");
    await page.getByRole("link", { name: "Terms of Service" }).click();
    await expect(page).toHaveURL(/\/terms$/);
  });

  test("covers content rules, links, reporting and contact", async ({ page }) => {
    await page.goto("terms");
    for (const heading of ["Your content", "Links to other sites", "Reporting and moderation", "Contact"]) {
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /@gmail\.com$/ }).first()).toHaveAttribute("href", /^mailto:/);
  });
});

test.describe("Project link and reporting", () => {
  test("the project link is marked nofollow ugc", async ({ page }) => {
    await mockGravesList(page, [makeGrave({ public_slug: "ugc-1", project_url: "https://github.com/me/x" })]);
    await page.goto("graves/ugc-1");

    const rel = await page.getByRole("link", { name: /visit the project/i }).getAttribute("rel");
    for (const token of ["nofollow", "ugc", "noopener", "noreferrer"]) expect(rel).toContain(token);
  });

  test("visitors get a prefilled report link", async ({ page }) => {
    await mockGravesList(page, [makeGrave({ public_slug: "rep-1", name: "Report Me", author_id: "someone-else" })]);
    await page.goto("graves/rep-1");

    const href = (await page.getByRole("link", { name: "Report this grave" }).getAttribute("href"))!;
    expect(href).toMatch(/^mailto:[^?]+@/);
    const params = new URL(href).searchParams;
    expect(params.get("subject")).toBe("Report: Report Me (rep-1)");
    expect(params.get("body")).toContain("/graves/rep-1");
  });

  test("authors don't see a report link on their own grave", async ({ page }) => {
    await mockGravesList(page, [makeGrave({ public_slug: "own-1", author_id: "user-1" })]);
    await login(page);
    await page.goto("graves/own-1");

    await expect(page.getByRole("button", { name: /delete the grave of/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Report this grave" })).toHaveCount(0);
  });
});

test.describe("Hidden graves", () => {
  test("the author is told their grave was hidden by a moderator", async ({ page }) => {
    await mockGravesList(page, [makeGrave({ public_slug: "hid-1", author_id: "user-1", hidden: true })]);
    await login(page);
    await page.goto("graves/hid-1");

    await expect(page.getByRole("status").filter({ hasText: /hidden by a moderator/i })).toBeVisible();
  });

  test("an ordinary grave shows no moderation notice", async ({ page }) => {
    await mockGravesList(page, [makeGrave({ public_slug: "ok-1", author_id: "user-1" })]);
    await login(page);
    await page.goto("graves/ok-1");

    await expect(page.getByRole("button", { name: /delete the grave of/i })).toBeVisible();
    await expect(page.getByText(/hidden by a moderator/i)).toHaveCount(0);
  });

  test("public listings ask the database to exclude hidden graves", async ({ page }) => {
    const queries: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.pathname.endsWith("/rest/v1/graves")) queries.push(url.search);
    });
    await mockGravesList(page, []);
    await page.goto("cemetery");
    await page.waitForLoadState("networkidle");
    await page.goto("");
    await page.waitForLoadState("networkidle");

    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) expect(q).toContain("hidden=eq.false");
  });
});
