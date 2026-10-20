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
  project_url: string | null;
  public_slug: string;
  is_public: boolean;
  tombstone_bg: string;
  tombstone_fg: string;
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
    project_url: null,
    public_slug: "devflow-abc123",
    is_public: true,
    tombstone_bg: "grave_bg_01.webp",
    tombstone_fg: "grave_01.webp",
    created_at: now(),
    updated_at: now(),
    ...overrides,
  };
}

export function homeStatsFor(graves: MockGrave[]) {
  const publicGraves = graves.filter((g) => g.is_public);
  const counts = new Map<string, number>();
  for (const g of publicGraves) {
    if (g.cause) counts.set(g.cause, (counts.get(g.cause) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0];
  return {
    total_graves: publicGraves.length,
    developers: new Set(publicGraves.map((g) => g.author_id)).size,
    top_cause: top?.[0] ?? null,
  };
}

export function mockHomeStats(
  page: Page,
  stats: ReturnType<typeof homeStatsFor>,
) {
  return page.route("**/rest/v1/rpc/home_stats*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stats),
    });
  });
}

export async function mockGravesList(page: Page, graves: MockGrave[]) {
  await mockHomeStats(page, homeStatsFor(graves));
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

export function makeManyGraves(total: number): MockGrave[] {
  return Array.from({ length: total }, (_, i) => {
    const n = String(i + 1).padStart(4, "0");
    return makeGrave({
      id: `grave-${n}`,
      name: `Project ${n}`,
      public_slug: `project-${n}`,
      created_at: new Date(Date.UTC(2026, 0, 1) - i * 60_000).toISOString(),
    });
  });
}

function likeToRegExp(pattern: string) {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\" && i + 1 < pattern.length) {
      source += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else if (c === "%") {
      source += ".*";
    } else if (c === "_") {
      source += ".";
    } else {
      source += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`, "i");
}

export async function mockPaginatedGraves(
  page: Page,
  all: MockGrave[],
  options: { failOffsets?: number[] } = {},
) {
  const failures = new Set(options.failOffsets ?? []);
  await mockHomeStats(page, homeStatsFor(all));
  return page.route("**/rest/v1/graves*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? all.length);

    if (failures.delete(offset)) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "boom" }),
      });
      return;
    }

    const nameFilter = url.searchParams.get("name");
    const matches = nameFilter?.startsWith("ilike.")
      ? all.filter((g) =>
          likeToRegExp(nameFilter.slice("ilike.".length)).test(g.name),
        )
      : all;

    const slice = matches.slice(offset, offset + limit);
    const end = slice.length ? offset + slice.length - 1 : offset;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "content-range": slice.length ? `${offset}-${end}/${matches.length}` : `*/${matches.length}`,
        "access-control-expose-headers": "Content-Range",
      },
      body: JSON.stringify(slice),
    });
  });
}
