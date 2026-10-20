-- CONTRACT step of "no more private graves". Apply ONLY after the front-end
-- that no longer reads or writes `is_public` is deployed: until then the live
-- site still filters on this column and would break.
-- (The earlier step is 20261020210000_public_graves_and_founding_ghosts.sql.)
alter table public.graves drop constraint if exists graves_always_public;
alter table public.graves drop column if exists is_public;
