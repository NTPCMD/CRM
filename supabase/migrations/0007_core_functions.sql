-- 0007_core_functions.sql
-- Volume 2 §26 — core RPCs: workspace provisioning, default-role seeding, and
-- workspace-scoped sequential numbering (project / invoice numbers).

-- Per-workspace counters for human-friendly sequential numbers. -------------
create table if not exists public.number_sequences (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind         text not null,
  current      bigint not null default 0,
  primary key (workspace_id, kind)
);
alter table public.number_sequences enable row level security;
-- No policies: only the SECURITY DEFINER app.next_number() writes/reads these.

create or replace function app.next_number(p_ws uuid, p_kind text, p_prefix text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v bigint;
begin
  insert into public.number_sequences (workspace_id, kind, current)
  values (p_ws, p_kind, 1)
  on conflict (workspace_id, kind)
    do update set current = public.number_sequences.current + 1
  returning current into v;
  return p_prefix || '-' || lpad(v::text, 5, '0');
end;
$$;

create or replace function public.generate_project_number(p_ws uuid)
returns text language sql security definer set search_path = public, pg_temp
as $$ select app.next_number(p_ws, 'project', 'PRJ'); $$;

create or replace function public.generate_invoice_number(p_ws uuid)
returns text language sql security definer set search_path = public, pg_temp
as $$ select app.next_number(p_ws, 'invoice', 'INV'); $$;

-- Seed the three default roles for a new workspace; returns the CEO role id. -
create or replace function app.seed_default_roles(p_ws uuid, p_owner uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ceo uuid;
  v_worker uuid;
  v_client uuid;
begin
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, created_by)
    values (p_ws, 'ceo', 'CEO', 'Full administrative access', true, true, p_owner)
    returning id into v_ceo;
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, created_by)
    values (p_ws, 'worker', 'Worker', 'Operational access, scoped by assignment', false, true, p_owner)
    returning id into v_worker;
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, created_by)
    values (p_ws, 'client', 'Client', 'Client portal access', false, true, p_owner)
    returning id into v_client;

  insert into public.role_permissions (role_id, permission_id)
    select v_worker, id from public.permissions where key = any (array[
      'crm.view','crm.manage','projects.view','projects.manage',
      'tasks.view','tasks.manage','calendar.view','calendar.manage',
      'messaging.internal','messaging.client','files.view','files.manage',
      'contracts.view','invoices.view','meetingnotes.view','meetingnotes.manage']);

  insert into public.role_permissions (role_id, permission_id)
    select v_client, id from public.permissions where key = any (array[
      'projects.view','calendar.view','messaging.client','files.view',
      'contracts.view','invoices.view','meetingnotes.view']);

  return v_ceo;
end;
$$;

-- Provision a workspace, seed its roles, and make the caller its CEO. --------
create or replace function public.create_workspace(p_name text, p_slug text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ws    uuid;
  v_slug  text;
  v_owner uuid := auth.uid();
  v_ceo   uuid;
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;

  v_slug := coalesce(nullif(p_slug, ''),
    trim(both '-' from lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'))));
  -- ensure uniqueness by appending a short random suffix if needed
  if exists (select 1 from public.workspaces where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  insert into public.workspaces (name, slug, created_by, updated_by)
    values (p_name, v_slug, v_owner, v_owner)
    returning id into v_ws;

  v_ceo := app.seed_default_roles(v_ws, v_owner);

  insert into public.workspace_members
    (workspace_id, profile_id, role_id, status, joined_at, created_by)
    values (v_ws, v_owner, v_ceo, 'active', now(), v_owner);

  perform app.log_activity(v_ws, 'workspace.created', 'workspace', v_ws,
    jsonb_build_object('name', p_name));

  return v_ws;
end;
$$;

grant execute on function public.create_workspace(text, text) to authenticated;
grant execute on function public.generate_project_number(uuid) to authenticated, service_role;
grant execute on function public.generate_invoice_number(uuid) to authenticated, service_role;
