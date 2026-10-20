-- 1. Landing stats were computed in the browser from `select author_id, cause`
--    over every public grave: it downloaded the whole table on each visit, and
--    PostgREST silently caps responses at 1000 rows, so the numbers were wrong
--    beyond that. Aggregate in the database instead; only 3 values leave it.
create or replace function public.home_stats()
returns table (total_graves bigint, developers bigint, top_cause text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*),
    count(distinct g.author_id),
    (
      select p.cause
      from public.graves p
      where p.is_public and p.cause is not null and p.cause <> ''
      group by p.cause
      order by count(*) desc, p.cause asc
      limit 1
    )
  from public.graves g
  where g.is_public;
$$;

revoke execute on function public.home_stats() from public;
grant execute on function public.home_stats() to anon, authenticated;

-- 2. graves_public_slug_idx duplicates the index backing the UNIQUE constraint
--    graves_public_slug_unique: same column, extra write cost, no benefit.
drop index if exists public.graves_public_slug_idx;
