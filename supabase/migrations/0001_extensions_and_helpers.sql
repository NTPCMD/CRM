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

-- Create INSERT/UPDATE/DELETE policies for a table WITHOUT touching SELECT.
-- Important: a `FOR ALL` policy's USING clause also applies to SELECT and is
-- OR-combined with other permissive policies, which would leak read access.
-- Write policies must therefore be scoped to write commands only; SELECT is
-- always governed solely by the table's dedicated `_select` policy.
create or replace function app.write_policies(
  p_table regclass, p_using text, p_check text
)
returns void
language plpgsql
as $$
declare
  t  text := p_table::text;
  nm text := replace(t, '.', '_');
begin
  execute format('create policy %I on %s for insert with check (%s)',
                 nm || '_insert', t, p_check);
  execute format('create policy %I on %s for update using (%s) with check (%s)',
                 nm || '_update', t, p_using, p_check);
  execute format('create policy %I on %s for delete using (%s)',
                 nm || '_delete', t, p_using);
end;
$$;
