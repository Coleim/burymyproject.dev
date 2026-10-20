/**
 * Encrypted export of the project's data (graves + users). There are no
 * automatic backups on the Supabase Free plan; the scheduled workflow
 * .github/workflows/backup.yml runs this weekly. The repository is public, so
 * the file is ALWAYS encrypted: it contains emails and private graves.
 *
 * Usage:  npm run export [-- --out backup.bmpx]
 *         npm run export:decrypt -- backup.bmpx [--out backup.json]
 *
 * Env:    VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BACKUP_PASSPHRASE (>= 12 chars)
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { encryptJson } from "./lib/export-crypto.mjs";
import { buildSnapshot } from "./lib/export-snapshot.mjs";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const passphrase = process.env.BACKUP_PASSPHRASE;

if (!url || !serviceRoleKey || !passphrase) {
  console.error(
    "Missing env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BACKUP_PASSPHRASE",
  );
  process.exit(1);
}

const outIndex = process.argv.indexOf("--out");
const out =
  outIndex > -1
    ? process.argv[outIndex + 1]
    : `burymyproject-backup-${new Date().toISOString().slice(0, 10)}.bmpx`;

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const snapshot = await buildSnapshot(client, {
  project: new URL(url).hostname.split(".")[0],
});
writeFileSync(out, encryptJson(snapshot, passphrase), { mode: 0o600 });
console.log(
  `Encrypted export written to ${out}: ${snapshot.counts.graves} graves, ${snapshot.counts.users} users.`,
);
