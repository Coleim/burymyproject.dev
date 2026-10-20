/**
 * Generates dist/sitemap.xml after `vite build`: static pages + every public
 * grave (read with the anon key, so RLS applies exactly like a visitor).
 *
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY (optional:
 * without them only the static pages are listed), SITE_URL (optional).
 */
import { mkdirSync, writeFileSync } from "node:fs";

const SITE_URL = (
  process.env.SITE_URL ?? "https://coleim.github.io/burymyproject.dev/"
).replace(/\/?$/, "/");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const PAGE_SIZE = 1000;
const MAX_URLS = 50000; // sitemap protocol limit

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

async function fetchPublicGraves() {
  const graves = [];
  for (let from = 0; graves.length < MAX_URLS; from += PAGE_SIZE) {
    const url = new URL(`${supabaseUrl}/rest/v1/graves`);
    url.searchParams.set("select", "public_slug,updated_at");
    url.searchParams.set("is_public", "eq.true");
    url.searchParams.set("order", "created_at.desc");
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Range: `${from}-${from + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const page = await res.json();
    graves.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return graves.slice(0, MAX_URLS);
}

const entries = [
  { path: "", priority: "1.0" },
  { path: "cemetery", priority: "0.8" },
  { path: "privacy", priority: "0.2" },
];

if (supabaseUrl && anonKey) {
  try {
    for (const grave of await fetchPublicGraves()) {
      entries.push({
        path: `graves/${encodeURIComponent(grave.public_slug)}`,
        lastmod: grave.updated_at?.slice(0, 10),
        priority: "0.6",
      });
    }
  } catch (error) {
    console.warn(`sitemap: could not list graves (${error.message}); static pages only`);
  }
} else {
  console.warn("sitemap: Supabase env vars missing; static pages only");
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ path, lastmod, priority }) =>
      `  <url><loc>${escapeXml(SITE_URL + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<priority>${priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/sitemap.xml", xml);
console.log(`sitemap: ${entries.length} URLs written to dist/sitemap.xml`);
