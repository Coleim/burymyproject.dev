-- Optional link to the (dead) project: repository, demo, website...
-- Only http(s) URLs are accepted, enforced in the database because RLS and
-- constraints are the only server-side barrier (no custom backend).
alter table public.graves
  add column if not exists project_url text;

alter table public.graves
  drop constraint if exists graves_project_url_check;

alter table public.graves
  add constraint graves_project_url_check
  check (
    project_url is null
    or (char_length(project_url) <= 500 and project_url ~* '^https?://[^\s]+$')
  );
