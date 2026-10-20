-- 1. Every grave is public (no more private graves).
--    Expand/contract: the `is_public` column stays for now, always true,
--    because the deployed site still filters on it. It is dropped by
--    supabase/migrations/pending/20261020220000_drop_is_public.sql, to apply
--    once the front-end without it is live.
do $$
begin
  if exists (select 1 from public.graves where not is_public) then
    raise exception 'Private graves exist: review or delete them before removing the concept.';
  end if;
end $$;

alter table public.graves drop constraint if exists graves_always_public;
alter table public.graves add constraint graves_always_public check (is_public);

alter policy "public can view public graves" on public.graves
  to anon, authenticated
  using (hidden = false or (select auth.uid()) = author_id);

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
      where not p.hidden and p.cause is not null and p.cause <> ''
      group by p.cause
      order by count(*) desc, p.cause asc
      limit 1
    )
  from public.graves g
  where not g.hidden;
$$;

-- 2. Founding Ghosts: the first 10 people to bury a grave each get a golden
--    first grave, numbered 1..10. A slot is permanent: deleting the grave or
--    the account never frees it.
alter table public.graves add column if not exists founding_rank smallint;
alter table public.graves drop constraint if exists graves_founding_rank_range;
alter table public.graves
  add constraint graves_founding_rank_range
  check (founding_rank is null or founding_rank between 1 and 10);
create unique index if not exists graves_founding_rank_key
  on public.graves (founding_rank) where founding_rank is not null;

-- The ledger of claimed slots. Rows are never deleted: user_id / grave_id are
-- nulled when the person or the grave goes away, but the slot stays used.
create table if not exists public.founding_ghosts (
  rank       smallint primary key check (rank between 1 and 10),
  user_id    uuid unique references auth.users (id) on delete set null,
  grave_id   uuid unique references public.graves (id) on delete set null,
  claimed_at timestamptz not null default now()
);
alter table public.founding_ghosts enable row level security;
revoke all on table public.founding_ghosts from anon, authenticated;

create or replace function public.claim_founding_ghost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed int;
  author_email text;
begin
  -- Only a real person signed in through the API claims a slot: not admin
  -- tooling (seeds, restores), whose requests carry no matching user.
  if (select auth.uid()) is distinct from new.author_id then
    return null;
  end if;

  -- Reserved domains are used by automated tests, never by real accounts.
  select u.email into author_email from auth.users u where u.id = new.author_id;
  if author_email is null
     or author_email ~* '(@example\.(com|org|net)|\.(invalid|test|example))$' then
    return null;
  end if;

  perform pg_advisory_xact_lock(827001); -- one claim at a time

  if exists (select 1 from public.founding_ghosts where user_id = new.author_id) then
    return null; -- one slot per person: only their first grave is golden
  end if;

  select count(*) into claimed from public.founding_ghosts;
  if claimed >= 10 then
    return null;
  end if;

  insert into public.founding_ghosts (rank, user_id, grave_id)
    values (claimed + 1, new.author_id, new.id);
  update public.graves set founding_rank = claimed + 1 where id = new.id;
  return null;
end;
$$;

revoke execute on function public.claim_founding_ghost() from public, anon, authenticated;

drop trigger if exists claim_founding_ghost on public.graves;
create trigger claim_founding_ghost
  after insert on public.graves
  for each row execute function public.claim_founding_ghost();

-- `founding_rank` can only be set by the claim above: never by a client.
create or replace function public.protect_grave_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.created_at := now();
      new.updated_at := now();
      new.hidden := false;
      new.founding_rank := null;
      if (
        select count(*) from public.graves where author_id = new.author_id
      ) >= 200 then
        raise exception 'You have reached the limit of 200 graves.'
          using errcode = 'check_violation';
      end if;
    else
      new.created_at := old.created_at;
      new.public_slug := old.public_slug;
      new.tombstone_bg := old.tombstone_bg;
      new.tombstone_fg := old.tombstone_fg;
      new.hidden := old.hidden;
      new.founding_rank := old.founding_rank;
    end if;
  end if;
  return new;
end;
$$;
