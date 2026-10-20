-- How many Founding Ghost slots are taken, for the "N of 10 spots left" teaser
-- on the home page. The ledger itself is unreachable for API roles (it names
-- people), so this security-definer function exposes only the count. It must
-- read the ledger and not the graves: a slot stays used when its grave or its
-- owner is deleted.
create or replace function public.founding_spots_claimed()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.founding_ghosts;
$$;

revoke execute on function public.founding_spots_claimed() from public;
grant execute on function public.founding_spots_claimed() to anon, authenticated;
