-- 0004_security_functions.sql
-- Volume 2 §25, Volume 4 §5 — the authorization engine as SECURITY DEFINER
-- helpers. RLS policies call these; because they are SECURITY DEFINER they read
-- the RBAC tables without triggering RLS (no recursion).

-- Is the current user an active member of the workspace?
create or replace function app.is_member(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace
      and wm.profile_id = auth.uid()
      and wm.status = 'active'
      and wm.deleted_at is null
  );
$$;

-- Does the current user's role grant everything in this workspace (CEO/owner)?
create or replace function app.is_admin(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.roles r on r.id = wm.role_id
    where wm.workspace_id = p_workspace
      and wm.profile_id = auth.uid()
      and wm.status = 'active'
      and wm.deleted_at is null
      and r.grants_all
  );
$$;

-- Effective permission check: deny override > grants_all > role grant > allow
-- override. Membership is required for any grant to apply.
create or replace function app.has_permission(p_workspace uuid, p_perm text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when not app.is_member(p_workspace) then false
      -- explicit deny wins
      when exists (
        select 1 from public.user_permissions up
        join public.permissions pm on pm.id = up.permission_id
        where up.workspace_id = p_workspace
          and up.profile_id = auth.uid()
          and pm.key = p_perm
          and up.effect = 'deny'
          and up.deleted_at is null
      ) then false
      -- role grants everything
      when app.is_admin(p_workspace) then true
      -- role explicitly grants the permission
      when exists (
        select 1
        from public.workspace_members wm
        join public.role_permissions rp on rp.role_id = wm.role_id
        join public.permissions pm on pm.id = rp.permission_id
        where wm.workspace_id = p_workspace
          and wm.profile_id = auth.uid()
          and wm.status = 'active'
          and wm.deleted_at is null
          and pm.key = p_perm
      ) then true
      -- user-level allow override
      when exists (
        select 1 from public.user_permissions up
        join public.permissions pm on pm.id = up.permission_id
        where up.workspace_id = p_workspace
          and up.profile_id = auth.uid()
          and pm.key = p_perm
          and up.effect = 'allow'
          and up.deleted_at is null
      ) then true
      else false
    end;
$$;

-- Do the current user and the target profile share any workspace? Used by the
-- profiles SELECT policy so members can see each other's basic identity.
create or replace function app.shares_workspace(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members a
    join public.workspace_members b on a.workspace_id = b.workspace_id
    where a.profile_id = auth.uid()
      and b.profile_id = p_profile
      and a.status = 'active' and b.status = 'active'
      and a.deleted_at is null and b.deleted_at is null
  );
$$;
