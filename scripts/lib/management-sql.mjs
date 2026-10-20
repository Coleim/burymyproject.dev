/**
 * Runs SQL against the Supabase project through the Management API
 * (HTTPS, so it works even where the Postgres port / IPv6 is unreachable).
 *
 * Required env vars:
 *   SUPABASE_ACCESS_TOKEN  personal access token (https://supabase.com/dashboard/account/tokens)
 *   VITE_SUPABASE_URL      used to derive the project ref
 */
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!accessToken || !supabaseUrl) {
  console.error(
    "Missing required env vars: SUPABASE_ACCESS_TOKEN, VITE_SUPABASE_URL",
  );
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

export async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`SQL failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

export function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function sqlTextArray(values) {
  return `array[${values.map(sqlText).join(", ")}]::text[]`;
}

export const SEED_EMAIL = "seed-bot@burymyproject.invalid";
