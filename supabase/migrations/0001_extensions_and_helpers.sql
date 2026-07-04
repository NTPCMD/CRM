-- 0001_extensions_and_helpers.sql
-- Volume 2 foundation: extensions, the `app` helper schema, and shared
-- trigger functions used by every table (updated_at maintenance).

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;        -- fuzzy / FTS support
create extension if not exists citext;         -- case-insensitive email

-- The `app` schema holds SECURITY DEFINER helpers used inside RLS policies so
-- that policy expressions stay short and never recurse into RLS themselves.
create schema if not exists app;

-- Keep updated_at fresh on every row change.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Convenience: attach the standard updated_at trigger to a table.
create or replace function app.attach_updated_at(p_table regclass)
returns void
language plpgsql
as $$
declare
  trig_name text := 'set_updated_at_' || replace(p_table::text, '.', '_');
begin
  execute format(
    'create trigger %I before update on %s
       for each row execute function app.set_updated_at()',
    trig_name, p_table
  );
end;
$$;
