const PAGE_SIZE = 1000;

/** Reads every row of a table with supabase-js, 1000 at a time (PostgREST's cap). */
async function fetchAllRows(client, table, orderBy) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function fetchAllUsers(client) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(`Could not list users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < PAGE_SIZE) return users;
  }
}

/**
 * Everything needed to rebuild the project's data: all graves (hidden ones
 * included) and the users with their sign-in identities, so graves can be
 * re-attached to people when they sign in again.
 * `client` is a supabase-js client created with the service-role key.
 */
export async function buildSnapshot(client, { now = new Date(), project = "" } = {}) {
  const [graves, users] = await Promise.all([
    fetchAllRows(client, "graves", "created_at"),
    fetchAllUsers(client),
  ]);

  return {
    format: 1,
    exported_at: now.toISOString(),
    project,
    counts: { users: users.length, graves: graves.length },
    users: users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      providers: u.app_metadata?.providers ?? [],
      identities: (u.identities ?? []).map((i) => ({
        provider: i.provider,
        identity_id: i.identity_id ?? i.id,
        identity_data: i.identity_data ?? null,
      })),
    })),
    graves,
  };
}
