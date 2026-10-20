import { expect, test, type Page } from "@playwright/test";
import { makeGrave, mockLoginSuccess } from "./mocks/supabase";

async function login(page: Page) {
  await mockLoginSuccess(page);
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);
}

test.describe("Edit a grave", () => {
  test("author edits a grave and lands back on its page", async ({ page }) => {
    const grave = makeGrave({ name: "Old Name", public_slug: "old-name-1" });
    let patchBody: Record<string, unknown> | null = null;

    await page.route("**/rest/v1/graves*", async (route) => {
      const request = route.request();
      if (request.method() === "PATCH") {
        patchBody = request.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ public_slug: grave.public_slug }),
        });
        return;
      }
      const url = request.url();
      const isSingle = url.includes(`public_slug=eq.${grave.public_slug}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? [{ ...grave, ...(patchBody ?? {}) }] : []),
      });
    });

    await login(page);
    await page.goto(`graves/${grave.public_slug}`);
    await page.getByRole("link", { name: "Edit this grave" }).click();

    await expect(page).toHaveURL(/\/graves\/old-name-1\/edit$/);
    const name = page.getByLabel("Project name");
    await expect(name).toHaveValue("Old Name");
    await name.fill("Renamed Project");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/graves\/old-name-1$/);
    expect(patchBody).toMatchObject({ name: "Renamed Project" });
    expect(patchBody).not.toHaveProperty("author_id");
    expect(patchBody).not.toHaveProperty("tombstone_bg");
    await expect(
      page.getByRole("heading", { name: "Renamed Project" }),
    ).toBeVisible();
  });

  test("shows not-found when the grave isn't owned by the user", async ({ page }) => {
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await login(page);
    await page.goto("graves/someone-elses/edit");

    await expect(page.getByText(/isn't yours to edit/i)).toBeVisible();
  });

  test("redirects to login when logged out", async ({ page }) => {
    await page.goto("graves/any/edit");
    await expect(page).toHaveURL(/\/login\?redirectTo=/);
  });

  test("only the author sees the Edit button", async ({ page }) => {
    const grave = makeGrave({ author_id: "someone-else", public_slug: "theirs-1" });
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([grave]),
      });
    });

    await login(page);
    await page.goto("graves/theirs-1");

    await expect(page.getByRole("heading", { name: grave.name })).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit this grave" })).toBeHidden();
  });

  test("Edit and Delete buttons have the same height and font", async ({ page }) => {
    const grave = makeGrave({ public_slug: "mine-1" });
    await page.route("**/rest/v1/graves*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([grave]) }),
    );
    await login(page);
    await page.goto("graves/mine-1");

    const measure = (name: RegExp, role: "link" | "button") =>
      page.getByRole(role, { name }).evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          height: Math.round(el.getBoundingClientRect().height),
          font: `${cs.fontFamily}|${cs.fontSize}|${cs.letterSpacing}|${cs.textTransform}`,
        };
      });
    const edit = await measure(/Edit this grave/, "link");
    const del = await measure(/Delete the grave/, "button");

    expect(del).toEqual(edit);
  });
});
