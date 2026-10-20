import { expect, test } from "@playwright/test";
import { makeGrave, mockGraveInsert, mockLoginSuccess } from "./mocks/supabase";

test("creates a grave and redirects to its public page", async ({ page }) => {
  await mockLoginSuccess(page);
  await page.route("**/rest/v1/graves*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Log in first since /graves/new is a protected route.
  await page.goto("login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/my-graves$/);

  const grave = makeGrave({ name: "Smoke Test Project" });
  await mockGraveInsert(page, grave);
  await page.route("**/rest/v1/graves*", async (route) => {
    const url = route.request().url();
    if (
      route.request().method() !== "GET" ||
      !url.includes(`public_slug=eq.${grave.public_slug}`)
    ) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([grave]),
    });
  });

  await page.goto("graves/new");
  await page.getByLabel("Project name").fill(grave.name);
  await page.getByLabel("Epitaph").fill(grave.epitaph ?? "");
  await page.getByLabel("Date of birth").fill(grave.born ?? "");
  await page.getByLabel("Date of death").fill(grave.died ?? "");
  await page.getByLabel("Cause of death").fill(grave.cause ?? "");
  await page.getByRole("button", { name: /bury the project/i }).click();

  await expect(page).toHaveURL(new RegExp(`/graves/${grave.public_slug}$`));
  await expect(
    page.getByRole("heading", { name: grave.name }),
  ).toBeVisible();
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("puts the submit button below both the form and the preview", async ({
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

    await page.goto("graves/new");

    const form = page.locator("#grave-form");
    const preview = page.getByTestId("grave-preview");
    const submit = page.getByRole("button", { name: /bury the project/i });

    const formBox = await form.boundingBox();
    const previewBox = await preview.boundingBox();
    const submitBox = await submit.boundingBox();

    expect(formBox && previewBox && submitBox).toBeTruthy();
    expect(previewBox!.y).toBeGreaterThanOrEqual(formBox!.y + formBox!.height - 1);
    expect(submitBox!.y).toBeGreaterThanOrEqual(
      previewBox!.y + previewBox!.height - 1,
    );
  });
});

test.describe("project link", () => {
  test("rejects a non-http link and shows an inline error", async ({ page }) => {
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

    await page.goto("graves/new");
    await page.getByLabel("Project name").fill("Link Test");
    await page.getByLabel("Epitaph").fill("Gone.");
    await page.getByLabel("Date of birth").fill("2024-01-01");
    await page.getByLabel("Date of death").fill("2024-02-01");
    await page.getByLabel("Cause of death").fill("Scope Creep");
    await page.getByLabel(/project link/i).fill("javascript:alert(1)");
    await page.getByRole("button", { name: /bury the project/i }).click();

    await expect(page.getByText(/valid link starting with http/i)).toBeVisible();
    await expect(page).toHaveURL(/\/graves\/new$/);
  });

  test("sends project_url on create and shows a safe outbound link", async ({ page }) => {
    const grave = makeGrave({
      name: "Linked Project",
      public_slug: "linked-1",
      project_url: "https://github.com/me/linked",
    });
    let postBody: Record<string, unknown> | null = null;

    await mockLoginSuccess(page);
    await page.route("**/rest/v1/graves*", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        postBody = request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ public_slug: grave.public_slug }),
        });
        return;
      }
      const isSingle = request.url().includes(`public_slug=eq.${grave.public_slug}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? [grave] : []),
      });
    });

    await page.goto("login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password1234");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/my-graves$/);

    await page.goto("graves/new");
    await page.getByLabel("Project name").fill(grave.name);
    await page.getByLabel("Epitaph").fill("Gone.");
    await page.getByLabel("Date of birth").fill("2024-01-01");
    await page.getByLabel("Date of death").fill("2024-02-01");
    await page.getByLabel("Cause of death").fill("Scope Creep");
    await page.getByLabel(/project link/i).fill("https://github.com/me/linked");
    await page.getByRole("button", { name: /bury the project/i }).click();

    await expect(page).toHaveURL(/\/graves\/linked-1$/);
    expect(postBody).toMatchObject({ project_url: "https://github.com/me/linked" });
    // Every grave is public: the client no longer sends a visibility flag.
    expect(postBody).not.toHaveProperty("is_public");

    const link = page.getByRole("link", { name: /visit the project/i });
    await expect(link).toHaveAttribute("href", "https://github.com/me/linked");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  });

  test("does not render a link for an unsafe stored URL", async ({ page }) => {
    const grave = makeGrave({
      public_slug: "unsafe-1",
      project_url: "javascript:alert(1)",
    });
    await page.route("**/rest/v1/graves*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([grave]),
      });
    });
    await page.goto("graves/unsafe-1");

    await expect(page.getByRole("heading", { name: grave.name })).toBeVisible();
    await expect(page.getByRole("link", { name: /visit the project/i })).toBeHidden();
  });
});
