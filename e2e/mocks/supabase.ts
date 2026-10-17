import type { Page } from "@playwright/test";

const now = () => new Date().toISOString();

export function mockSignupNeedsConfirmation(page: Page) {
  return page.route("**/auth/v1/signup*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        email: "new.user@example.com",
        confirmed_at: null,
        created_at: now(),
      }),
    });
  });
}

export function mockSignupAlreadyRegistered(page: Page) {
  return page.route("**/auth/v1/signup*", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: "user_already_exists",
        error_description: "User already registered",
      }),
    });
  });
}

function fakeSession(userId: string, email: string) {
  return {
    access_token: "fake-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "fake-refresh-token",
    user: {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email,
      email_confirmed_at: now(),
      app_metadata: {},
      user_metadata: {},
      created_at: now(),
    },
  };
}

export function mockLoginSuccess(page: Page, email = "test@example.com") {
  return page.route("**/auth/v1/token*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fakeSession("user-1", email)),
    });
  });
}

export function mockLoginFailure(page: Page) {
  return page.route("**/auth/v1/token*", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      }),
    });
  });
}

export type MockGrave = {
  id: string;
  author_id: string;
  name: string;
  description: string | null;
  epitaph: string | null;
  born: string | null;
  died: string | null;
  cause: string | null;
  tech_stack: string[];
  public_slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export function makeGrave(overrides: Partial<MockGrave> = {}): MockGrave {
  return {
    id: "grave-1",
    author_id: "user-1",
    name: "DevFlow",
    description: null,
    epitaph: "The README was the entire product.",
    born: "2024-01-01",
    died: "2024-02-01",
    cause: "Scope Creep",
    tech_stack: ["React", "Node"],
    public_slug: "devflow-abc123",
    is_public: true,
    created_at: now(),
    updated_at: now(),
    ...overrides,
  };
}

export function mockGravesList(page: Page, graves: MockGrave[]) {
  return page.route("**/rest/v1/graves*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(graves),
    });
  });
}

export function mockGraveInsert(page: Page, grave: MockGrave) {
  return page.route("**/rest/v1/graves*", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(grave),
    });
  });
}
