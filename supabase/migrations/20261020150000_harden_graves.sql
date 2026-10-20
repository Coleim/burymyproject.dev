-- Hardening of public.graves. RLS and constraints are the only server-side
-- barrier (no custom backend), so they must hold against direct API calls.

-- 1. Least-privilege table grants. RLS does not cover TRUNCATE/TRIGGER/
--    REFERENCES, and anonymous visitors only ever need to read.
revoke all on table public.graves from anon, authenticated;
grant select on table public.graves to anon;
grant select, insert, update, delete on table public.graves to authenticated;

-- 2. Policies: scoped to the right roles, auth.uid() evaluated once per
--    statement (initplan) instead of once per row, explicit WITH CHECK.
alter policy "public can view public graves" on public.graves
  to anon, authenticated
  using (is_public = true or (select auth.uid()) = author_id);

alter policy "authenticated users can create graves" on public.graves
  to authenticated
  with check ((select auth.uid()) = author_id);

alter policy "author can update own graves" on public.graves
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

alter policy "author can delete own graves" on public.graves
  to authenticated
  using ((select auth.uid()) = author_id);

-- 3. Size limits mirroring src/lib/schemas/grave.ts, enforced server-side.
alter table public.graves
  drop constraint if exists graves_description_len,
  drop constraint if exists graves_epitaph_len,
  drop constraint if exists graves_cause_len,
  drop constraint if exists graves_tech_stack_size,
  drop constraint if exists graves_tombstone_len,
  drop constraint if exists graves_public_slug_format;

alter table public.graves
  add constraint graves_description_len
    check (description is null or char_length(description) <= 1000),
  add constraint graves_epitaph_len
    check (epitaph is null or char_length(epitaph) <= 280),
  add constraint graves_cause_len
    check (cause is null or char_length(cause) <= 200),
  add constraint graves_tech_stack_size
    check (
      cardinality(tech_stack) <= 20
      and char_length(array_to_string(tech_stack, ',')) <= 1000
    ),
  add constraint graves_tombstone_len
    check (char_length(tombstone_bg) <= 100 and char_length(tombstone_fg) <= 100),
  add constraint graves_public_slug_format
    check (public_slug ~ '^[A-Za-z0-9_-]{6,64}$');

-- 4. Protect server-managed columns and cap graves per user. Only applies to
--    API roles: migrations, seeds and the service role keep full control.
create or replace function public.protect_grave_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      -- Prevents back/forward-dating to game "Recently Buried" ordering.
      new.created_at := now();
      new.updated_at := now();
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
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_graves_columns on public.graves;
create trigger protect_graves_columns
  before insert or update on public.graves
  for each row execute function public.protect_grave_columns();

-- 5. Linter findings.
alter function public.set_updated_at() set search_path = '';

-- ensure_rls is an event-trigger function: it needs no EXECUTE grant to run,
-- and must not be callable through /rest/v1/rpc.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
