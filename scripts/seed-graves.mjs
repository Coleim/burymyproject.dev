/**
 * Seeds fake graves for pagination / search / performance checks.
 *
 * Everything belongs to ONE dedicated user (seed-bot@burymyproject.invalid),
 * names start with "[SEED]" and created_at is backdated, so real graves stay
 * on top of the cemetery. Idempotent: re-running replaces the seed graves.
 * Remove everything with `npm run seed:remove`.
 *
 * Usage: npm run seed -- [count]   (default 4000)
 * Requires Node >= 22.18 (imports TypeScript constants) and the env vars
 * listed in scripts/lib/management-sql.mjs.
 */
import { CAUSES, EPITAPHS } from "../src/lib/constants/graveContent.ts";
import {
  runSql,
  SEED_EMAIL,
  sqlText,
  sqlTextArray,
} from "./lib/management-sql.mjs";

const count = Number(process.argv[2] ?? 4000);
if (!Number.isInteger(count) || count < 1 || count > 20000) {
  console.error("count must be an integer between 1 and 20000");
  process.exit(1);
}

const WORDS = [
  "Atlas", "Nimbus", "Orbit", "Pixel", "Quill", "Relay", "Sprout", "Tundra",
  "Vortex", "Willow", "Zenith", "Ember", "Harbor", "Lumen", "Mosaic", "Nova",
];
const STACKS = [
  "React", "Vue", "Svelte", "Node", "Deno", "Rust", "Go", "Python",
  "TypeScript", "Postgres", "Redis", "GraphQL", "Docker", "Kubernetes",
];
const BGS = Array.from({ length: 10 }, (_, i) => `grave_bg_${String(i + 1).padStart(2, "0")}.webp`);
const FGS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => `grave_${String(n).padStart(2, "0")}.webp`);

const pick = (name) => `(${name})[1 + floor(random() * array_length(${name}, 1))::int]`;

const sql = `
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  ${sqlText(SEED_EMAIL)}, 'x', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
where not exists (select 1 from auth.users where email = ${sqlText(SEED_EMAIL)});

delete from public.graves
where author_id = (select id from auth.users where email = ${sqlText(SEED_EMAIL)});

with
  consts as (
    select ${sqlTextArray(WORDS)} as words,
           ${sqlTextArray(STACKS)} as stacks,
           ${sqlTextArray(EPITAPHS)} as epitaphs,
           ${sqlTextArray(CAUSES)} as causes,
           ${sqlTextArray(BGS)} as bgs,
           ${sqlTextArray(FGS)} as fgs,
           (select id from auth.users where email = ${sqlText(SEED_EMAIL)}) as author
  ),
  rows as (
    select i, c.*, (date '2024-01-01' + (random() * 700)::int) as died_on
    from generate_series(1, ${count}) i cross join consts c
  )
insert into public.graves
  (author_id, name, epitaph, cause, born, died, tech_stack, is_public,
   tombstone_bg, tombstone_fg, created_at)
select
  author,
  '[SEED] ' || ${pick("words")} || ' ' || lpad(i::text, 5, '0'),
  ${pick("epitaphs")},
  ${pick("causes")},
  died_on - (10 + random() * 400)::int,
  died_on,
  array(
    select ${pick("stacks")}
    from generate_series(1, 1 + floor(random() * 4)::int + (i * 0))
  ),
  (i % 20 <> 0),
  ${pick("bgs")},
  ${pick("fgs")},
  now() - interval '1 year' - make_interval(mins => i)
from rows;

select count(*) as seeded,
       count(*) filter (where is_public) as public_seeded
from public.graves
where author_id = (select id from auth.users where email = ${sqlText(SEED_EMAIL)});
`;

const result = await runSql(sql);
console.log("Seed done:", JSON.stringify(result));
