-- 0006_foundation_rls.sql
-- Volume 2 §25 — deny-by-default RLS for the foundation tables, plus the role
-- grants Supabase's anon/authenticated roles need for RLS to take effect.

-- Grants: on Supabase, migrations run as `postgres` and default privileges hand
-- these to anon/authenticated/service_role automatically; we set them
-- explicitly so the schema is self-contained and testable locally. RLS still
-- gates every row.
grant usage on schema app to anon, authenticated, service_role;
grant execute on all functions in schema app to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;
grant select on public.permissions to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

-- Enable RLS ----------------------------------------------------------------
alter table public.workspaces         enable row level security;
alter table public.profiles           enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.permissions        enable row level security;
alter table public.roles              enable row level security;
alter table public.role_permissions   enable row level security;
alter table public.user_permissions   enable row level security;
alter table public.activity_logs      enable row level security;
alter table public.notifications      enable row level security;

-- workspaces ----------------------------------------------------------------
create policy workspaces_select on public.workspaces
  for select using (app.is_member(id));
create policy workspaces_insert on public.workspaces
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy workspaces_update on public.workspaces
  for update using (app.has_permission(id, 'settings.manage'))
  with check (app.has_permission(id, 'settings.manage'));

-- profiles ------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or app.shares_workspace(id));
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- workspace_members ---------------------------------------------------------
create policy members_select on public.workspace_members
  for select using (app.is_member(workspace_id));
create policy members_insert on public.workspace_members
  for insert with check (app.has_permission(workspace_id, 'users.manage'));
create policy members_update on public.workspace_members
  for update using (
    app.has_permission(workspace_id, 'users.manage') or profile_id = auth.uid()
  ) with check (
    app.has_permission(workspace_id, 'users.manage') or profile_id = auth.uid()
  );
create policy members_delete on public.workspace_members
  for delete using (app.has_permission(workspace_id, 'users.manage'));

-- permissions (read-only catalog) -------------------------------------------
create policy permissions_select on public.permissions
  for select using (auth.uid() is not null);

-- roles ---------------------------------------------------------------------
create policy roles_select on public.roles
  for select using (app.is_member(workspace_id));
create policy roles_write on public.roles
  for all using (app.has_permission(workspace_id, 'permissions.manage'))
  with check (app.has_permission(workspace_id, 'permissions.manage'));

-- role_permissions (scoped through the parent role's workspace) --------------
create policy role_permissions_select on public.role_permissions
  for select using (exists (
    select 1 from public.roles r
    where r.id = role_id and app.is_member(r.workspace_id)
  ));
create policy role_permissions_write on public.role_permissions
  for all using (exists (
    select 1 from public.roles r
    where r.id = role_id and app.has_permission(r.workspace_id, 'permissions.manage')
  )) with check (exists (
    select 1 from public.roles r
    where r.id = role_id and app.has_permission(r.workspace_id, 'permissions.manage')
  ));

-- user_permissions ----------------------------------------------------------
create policy user_permissions_select on public.user_permissions
  for select using (
    profile_id = auth.uid() or app.has_permission(workspace_id, 'permissions.manage')
  );
create policy user_permissions_write on public.user_permissions
  for all using (app.has_permission(workspace_id, 'permissions.manage'))
  with check (app.has_permission(workspace_id, 'permissions.manage'));

-- activity_logs (append-only; reads gated by activity.view; writes via
-- app.log_activity SECURITY DEFINER only) -----------------------------------
create policy activity_select on public.activity_logs
  for select using (app.has_permission(workspace_id, 'activity.view'));

-- notifications (recipient-scoped; writes via app.create_notification) -------
create policy notifications_select on public.notifications
  for select using (recipient_id = auth.uid());
create policy notifications_update on public.notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
create policy notifications_delete on public.notifications
  for delete using (recipient_id = auth.uid());
