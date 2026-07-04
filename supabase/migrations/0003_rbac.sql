-- 0003_rbac.sql
-- Volume 2 §10 — capability-based RBAC: a global permissions catalog, per-
-- workspace roles, role→permission grants, and per-user allow/deny overrides.

-- Global permission catalog (workspace-independent) -------------------------
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,           -- e.g. 'projects.edit'
  module      text not null,                  -- e.g. 'projects'
  description text,
  created_at  timestamptz not null default now()
);

-- Roles are per-workspace so each workspace can customize them. --------------
create table if not exists public.roles (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key          text not null,                 -- 'ceo','worker','client',custom
  name         text not null,
  description  text,
  grants_all   boolean not null default false,-- CEO / owner: full access
  is_system    boolean not null default false,-- seeded defaults; not deletable
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (workspace_id, key)
);

-- Now that roles exists, wire the workspace_members.role_id FK.
alter table public.workspace_members
  add constraint workspace_members_role_id_fkey
  foreign key (role_id) references public.roles(id) on delete set null;

create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Per-user overrides on top of the role baseline. deny wins over allow. ------
create table if not exists public.user_permissions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  effect        text not null check (effect in ('allow','deny')),
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (workspace_id, profile_id, permission_id)
);

create index if not exists roles_workspace_idx on public.roles (workspace_id);
create index if not exists user_permissions_lookup_idx
  on public.user_permissions (workspace_id, profile_id) where deleted_at is null;

select app.attach_updated_at('public.roles');
select app.attach_updated_at('public.user_permissions');
