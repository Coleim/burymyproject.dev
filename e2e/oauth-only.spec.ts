import { expect, test } from "@playwright/test";
import { mockGravesList, seedSession } from "./mocks/supabase";

// Runs against the production build (flag off): see playwright.config.ts.
test.describe("OAuth-only sign-in (production default)", () => {
  test("the login page offers Google and GitHub, and no email/password form", async ({ page }) => {
    await page.goto("login");

    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveCount(0);
    await expect(page.getByLabel("Password")).toHaveCount(0);
    await expect(page.getByText(/sign in with github or google/i)).toBeVisible();
    await expect(page).toHaveTitle(/Sign in/);
  });

  test("/signup leads to /login and keeps the destination", async ({ page }) => {
    await page.goto("signup?redirectTo=%2Fgraves%2Fnew");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fgraves%2Fnew$/);
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
  });

  test("the navbar shows a single 'Sign in' link instead of Log In / Sign Up", async ({ page }) => {
    await mockGravesList(page, []);
    await page.goto("");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^sign up$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^log in$/i })).toHaveCount(0);
  });

  test("the email form code is never downloaded", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (req) => {
      if (req.url().endsWith(".js")) scripts.push(req.url());
    });
    await page.goto("login");
    await page.waitForLoadState("networkidle");

    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.filter((u) => /Email(Login|SignUp)/.test(u))).toEqual([]);
  });

  test("an OAuth sign-in started from a protected page carries the destination", async ({ page }) => {
    let redirectTo: string | null = null;
    await page.route("**/auth/v1/authorize*", async (route) => {
      redirectTo = new URL(route.request().url()).searchParams.get("redirect_to");
      await route.fulfill({ status: 200, contentType: "text/html", body: "<p>provider</p>" });
    });

    await page.goto("graves/new");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fgraves%2Fnew$/);
    await page.getByRole("button", { name: /continue with github/i }).click();

    await expect.poll(() => redirectTo).not.toBeNull();
    expect(new URL(redirectTo!).pathname).toBe("/burymyproject.dev/login");
    expect(new URL(redirectTo!).searchParams.get("redirectTo")).toBe("/graves/new");
  });

  test("coming back from the provider signed in goes to the destination", async ({ page }) => {
    await seedSession(page);
    await page.goto("login?redirectTo=%2Fgraves%2Fnew");

    await expect(page).toHaveURL(/\/graves\/new$/);
    await expect(page.getByRole("heading", { name: "Dig a new grave" })).toBeVisible();
  });

  test("a signed-in visitor on /login with no destination lands on My Graveyard", async ({ page }) => {
    await mockGravesList(page, []);
    await seedSession(page);
    await page.goto("login");

    await expect(page).toHaveURL(/\/my-graves$/);
  });

  test("a hostile redirectTo is ignored even after OAuth", async ({ page }) => {
    await mockGravesList(page, []);
    await seedSession(page);
    const external: string[] = [];
    page.on("request", (req) => {
      if (new URL(req.url()).hostname === "evil.example.com") external.push(req.url());
    });

    await page.goto(`login?redirectTo=${encodeURIComponent("https://evil.example.com/phish")}`);

    await expect(page).toHaveURL(/\/my-graves$/);
    expect(external).toEqual([]);
  });
});
