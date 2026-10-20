-- Moderation: a grave can be hidden by an administrator. `is_public` can't do
-- this job because the author can flip it back; `hidden` can only be changed
-- by roles that are not 'anon'/'authenticated' (migrations, the Management
-- API, the service role). The author still sees their own hidden grave.
alter table public.graves
  add column if not exists hidden boolean not null default false;

alter policy "public can view public graves" on public.graves
  to anon, authenticated
  using (
    (is_public = true and hidden = false)
    or (select auth.uid()) = author_id
  );

-- Same trigger as before, plus `hidden`: forced to false on insert and frozen
-- on update for API roles.
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
    end if;
  end if;
  return new;
end;
$$;

-- Hidden graves don't count in the public stats.
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
      where p.is_public and not p.hidden and p.cause is not null and p.cause <> ''
      group by p.cause
      order by count(*) desc, p.cause asc
      limit 1
    )
  from public.graves g
  where g.is_public and not g.hidden;
$$;
