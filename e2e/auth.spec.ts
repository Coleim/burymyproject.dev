import { expect, test } from "@playwright/test";
import {
  mockLoginFailure,
  mockLoginSuccess,
  mockSignupAlreadyRegistered,
  mockSignupNeedsConfirmation,
} from "./mocks/supabase";

test.describe("Signup", () => {
  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("signup");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(
      page.getByText(/password must be at least 8 characters/i),
    ).toBeVisible();
  });

  test("shows a confirmation message after successful signup", async ({
    page,
  }) => {
    await mockSignupNeedsConfirmation(page);

    await page.goto("signup");
    await page.getByLabel("Email").fill("new.user@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password1234");
    await page.getByLabel("Confirm password").fill("password1234");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/almost buried/i)).toBeVisible();
  });

  test("shows an error when the email is already registered", async ({
    page,
  }) => {
    await mockSignupAlreadyRegistered(page);

    await page.goto("signup");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password1234");
    await page.getByLabel("Confirm password").fill("password1234");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText(/an account already exists/i),
    ).toBeVisible();
  });
});

test.describe("Login", () => {
  test("shows an error on invalid credentials", async ({ page }) => {
    await mockLoginFailure(page);

    await page.goto("login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page.getByText(/wrong email or password/i)).toBeVisible();
  });

  test("redirects to /my-graves after a successful login", async ({
    page,
  }) => {
    await mockLoginSuccess(page);
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password1234");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/my-graves$/);
    await expect(page.getByRole("heading", { name: /my graveyard/i })).toBeVisible();
  });
});

test.describe("OAuth buttons", () => {
  for (const [path, label] of [
    ["login", "Log in"],
    ["signup", "Sign up"],
  ]) {
    test(`${label} page sends GitHub sign-in to Supabase's authorize endpoint`, async ({ page }) => {
      let authorizeUrl: URL | null = null;
      await page.route("**/auth/v1/authorize*", async (route) => {
        authorizeUrl = new URL(route.request().url());
        await route.fulfill({ status: 200, contentType: "text/html", body: "<p>provider</p>" });
      });

      await page.goto(path);
      await page.getByRole("button", { name: /continue with github/i }).click();

      await expect.poll(() => authorizeUrl?.searchParams.get("provider")).toBe("github");
      expect(authorizeUrl!.searchParams.get("redirect_to")).toContain("/burymyproject.dev/");
    });
  }

  test("login page shows both Google and GitHub", async ({ page }) => {
    await page.goto("login");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
  });
});
