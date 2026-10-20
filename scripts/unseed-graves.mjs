/**
 * Removes everything created by seed-graves.mjs. Deleting the seed user
 * cascades to its graves (graves.author_id ... on delete cascade).
 * Only ever touches seed-bot@burymyproject.invalid.
 */
import { runSql, SEED_EMAIL, sqlText } from "./lib/management-sql.mjs";

const removed = await runSql(
  `delete from auth.users where email = ${sqlText(SEED_EMAIL)} returning id;`,
);
const left = await runSql(
  "select count(*) as seed_graves_left from public.graves where name like '[SEED] %';",
);
console.log(`Unseed done: ${removed.length} seed user removed,`, JSON.stringify(left));
