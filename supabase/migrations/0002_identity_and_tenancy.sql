-- 0002_identity_and_tenancy.sql
-- Volume 2 §1, §7, §8 — workspaces (the isolation boundary), profiles (global
-- identity, 1:1 with auth.users), and workspace_members (per-workspace role).
--
-- Design note (see docs/IMPLEMENTATION_REQUIREMENTS.md §6): a user may belong to
-- multiple workspaces, so role/membership live in workspace_members rather than
-- on profiles. workspaces/profiles are global tables and are the documented
-- exceptions to the "every table has workspace_id" rule.

-- Workspaces ----------------------------------------------------------------
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo        text,
  plan        text not null default 'free',
  status      text not null default 'active'
              check (status in ('active','suspended','archived')),
  timezone    text not null default 'UTC',
  country     text,
  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Profiles (global identity) -------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  first_name     text,
  last_name      text,
  email          citext,
  phone          text,
  avatar         text,
  timezone       text not null default 'UTC',
  language       text not null default 'en',
  job_title      text,
  notification_preferences jsonb not null default '{}'::jsonb,
  status         text not null default 'active'
                 check (status in ('active','invited','disabled')),
  last_seen      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Workspace membership + per-workspace role ---------------------------------
create table if not exists public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  role_id      uuid,  -- FK added in 0003 after roles exists
  status       text not null default 'active'
               check (status in ('invited','active','disabled')),
  invited_by   uuid references public.profiles(id),
  joined_at    timestamptz,
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (workspace_id, profile_id)
);

create index if not exists workspace_members_profile_idx
  on public.workspace_members (profile_id) where deleted_at is null;
create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id) where deleted_at is null;

select app.attach_updated_at('public.workspaces');
select app.attach_updated_at('public.profiles');
select app.attach_updated_at('public.workspace_members');
