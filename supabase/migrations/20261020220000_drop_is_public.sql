-- CONTRACT step of "no more private graves". It had to wait until the front-end
-- that no longer reads or writes `is_public` was deployed (checked: the live
-- bundle had no trace of it). Applied on 2026-10-20 after deploy.
-- (The earlier step is 20261020210000_public_graves_and_founding_ghosts.sql.)
alter table public.graves drop constraint if exists graves_always_public;
alter table public.graves drop column if exists is_public;
