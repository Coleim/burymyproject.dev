# Pending migrations

Steps that would break the deployed site if applied too early (for example,
dropping a column the live front-end still reads) wait here until the new
front-end is deployed. Check the live bundle first, then apply, then move the
file up to `supabase/migrations/`.

Currently empty.
