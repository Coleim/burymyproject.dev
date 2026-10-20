import { describe, expect, it } from "vitest";
import { buildSnapshot } from "./export-snapshot.mjs";

function fakeClient({ graves = [], users = [], gravesError = null } = {}) {
  const calls = { range: [], listUsers: [] };
  return {
    calls,
    from(table) {
      expect(table).toBe("graves");
      return {
        select: () => ({
          order: () => ({
            range: async (from, to) => {
              calls.range.push([from, to]);
              if (gravesError) return { data: null, error: { message: gravesError } };
              return { data: graves.slice(from, to + 1), error: null };
            },
          }),
        }),
      };
    },
    auth: {
      admin: {
        listUsers: async ({ page, perPage }) => {
          calls.listUsers.push([page, perPage]);
          return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null };
        },
      },
    },
  };
}

const grave = (i) => ({ id: `g${i}`, name: `Grave ${i}`, hidden: i % 2 === 1 });
const user = (i) => ({
  id: `u${i}`,
  email: `user${i}@example.com`,
  created_at: "2026-01-01T00:00:00Z",
  last_sign_in_at: null,
  app_metadata: { providers: ["github"] },
  identities: [{ provider: "github", identity_id: `i${i}`, identity_data: { user_name: `u${i}` } }],
});

describe("buildSnapshot", () => {
  it("reads more than one page of graves and users", async () => {
    const graves = Array.from({ length: 2500 }, (_, i) => grave(i));
    const users = Array.from({ length: 1500 }, (_, i) => user(i));
    const client = fakeClient({ graves, users });

    const snapshot = await buildSnapshot(client, { now: new Date("2026-10-20T00:00:00Z"), project: "abc" });

    expect(snapshot.counts).toEqual({ users: 1500, graves: 2500 });
    expect(snapshot.graves).toHaveLength(2500);
    expect(snapshot.users).toHaveLength(1500);
    expect(snapshot.exported_at).toBe("2026-10-20T00:00:00.000Z");
    expect(snapshot.project).toBe("abc");
    expect(client.calls.range).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
    expect(client.calls.listUsers.map(([page]) => page)).toEqual([1, 2]);
  });

  it("includes hidden graves (it's a backup, not a public listing)", async () => {
    const snapshot = await buildSnapshot(fakeClient({ graves: [grave(1), grave(2)] }));
    expect(snapshot.graves.map((g) => g.hidden)).toEqual([true, false]);
  });

  it("keeps what is needed to re-attach graves to people", async () => {
    const snapshot = await buildSnapshot(fakeClient({ users: [user(7)] }));
    expect(snapshot.users[0]).toEqual({
      id: "u7",
      email: "user7@example.com",
      created_at: "2026-01-01T00:00:00Z",
      last_sign_in_at: null,
      providers: ["github"],
      identities: [{ provider: "github", identity_id: "i7", identity_data: { user_name: "u7" } }],
    });
  });

  it("copes with an empty project", async () => {
    const snapshot = await buildSnapshot(fakeClient());
    expect(snapshot.counts).toEqual({ users: 0, graves: 0 });
  });

  it("fails loudly instead of writing a partial backup", async () => {
    await expect(buildSnapshot(fakeClient({ gravesError: "permission denied" }))).rejects.toThrow(/Could not read graves: permission denied/);
  });
});
