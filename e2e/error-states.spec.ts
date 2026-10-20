import { expect, test, type Page } from "@playwright/test";
import { makeGrave, mockHomeStats, mockLoginSuccess } from "./mocks/supabase";

async function login(page: Page) {
  await mockLoginSuccess(page);
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);
}

const fail = { status: 500, contentType: "application/json", body: '{"message":"boom"}' };
const ok = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Error states", () => {
  test("a failed load of a grave is not reported as 'does not exist', and retry works", async ({ page }) => {
    const grave = makeGrave({ name: "Flaky Project", public_slug: "flaky-1" });
    await mockHomeStats(page, { total_graves: 1, developers: 1, top_cause: null });
    // A flag rather than a call counter: React StrictMode (dev) runs effects twice.
    let failing = true;
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill(failing ? fail : ok([grave]));
    });

    await page.goto("graves/flaky-1");

    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    await expect(page.getByText(/doesn't exist/i)).toBeHidden();

    failing = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "Flaky Project" })).toBeVisible();
  });

  test("a failed load of My Graveyard shows an error instead of the empty state, and retry works", async ({ page }) => {
    const grave = makeGrave({ name: "Mine", public_slug: "mine-1" });
    await mockHomeStats(page, { total_graves: 0, developers: 0, top_cause: null });
    let failNext = false;
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill(failNext ? fail : ok([grave]));
    });

    await login(page);
    failNext = true;
    await page.goto("my-graves");

    await expect(page.getByRole("alert")).toContainText(/something went wrong/i);
    await expect(page.getByText(/No projects buried here/i)).toBeHidden();

    failNext = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "Mine" })).toBeVisible();
  });

  test("a failed delete keeps the user on the grave page and says so", async ({ page }) => {
    const grave = makeGrave({ name: "Stubborn", public_slug: "stubborn-1" });
    await mockHomeStats(page, { total_graves: 1, developers: 1, top_cause: null });
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill(route.request().method() === "DELETE" ? fail : ok([grave]));
    });
    page.on("dialog", (dialog) => dialog.accept());

    await login(page);
    await page.goto("graves/stubborn-1");
    await page.getByRole("button", { name: /delete the grave of stubborn/i }).click();

    await expect(page.getByRole("alert")).toContainText(/couldn't delete/i);
    await expect(page).toHaveURL(/\/graves\/stubborn-1$/);
  });
});
