/**
 * Hide or unhide a grave (moderation). A hidden grave disappears from every
 * public listing, search, the sitemap and the stats; only its author still
 * sees it, with a notice. The author can't undo it: `hidden` is frozen for
 * the API roles by the protect_grave_columns trigger.
 *
 * Usage:  npm run moderate -- hide   <slug or grave URL>
 *         npm run moderate -- unhide <slug or grave URL>
 *         npm run moderate -- show   <slug or grave URL>   (just print it)
 *
 * Env: SUPABASE_ACCESS_TOKEN, VITE_SUPABASE_URL (see scripts/lib/management-sql.mjs)
 */
import { runSql, sqlText } from "./lib/management-sql.mjs";

const [action, target] = process.argv.slice(2);
if (!["hide", "unhide", "show"].includes(action) || !target) {
  console.error("Usage: npm run moderate -- <hide|unhide|show> <slug or grave URL>");
  process.exit(1);
}

// Accept a pasted URL (…/graves/<slug>, with or without /edit, query or hash).
const slug = target.match(/\/graves\/([A-Za-z0-9_-]+)/)?.[1] ?? target;
if (!/^[A-Za-z0-9_-]{6,64}$/.test(slug)) {
  console.error(`"${target}" is not a valid grave slug or URL.`);
  process.exit(1);
}

const select = `
  select g.public_slug, g.name, g.hidden, g.founding_rank, g.created_at::date as buried,
         u.email as author
  from public.graves g left join auth.users u on u.id = g.author_id
  where g.public_slug = ${sqlText(slug)}`;

const [grave] = await runSql(select);
if (!grave) {
  console.error(`No grave with slug "${slug}".`);
  process.exit(1);
}
console.log("Before:", JSON.stringify(grave));

if (action !== "show") {
  const hidden = action === "hide";
  await runSql(
    `update public.graves set hidden = ${hidden} where public_slug = ${sqlText(slug)}`,
  );
  const [after] = await runSql(select);
  console.log("After: ", JSON.stringify(after));
}
