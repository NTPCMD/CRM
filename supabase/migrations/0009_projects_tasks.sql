-- 0009_projects_tasks.sql
-- Volume 2 §12-§13 — projects, membership, milestones, the task hierarchy
-- (tasks, subtasks, followers, dependencies, checklists, comments, time
-- entries), files, and approvals. Introduces project-scoped access helpers.

-- Mark the client default role so client-visibility filters can detect it.
alter table public.roles add column if not exists is_client boolean not null default false;

-- Re-seed helper now also flags the client role. (functions are replaceable)
create or replace function app.seed_default_roles(p_ws uuid, p_owner uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_ceo uuid; v_worker uuid; v_client uuid;
begin
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, created_by)
    values (p_ws,'ceo','CEO','Full administrative access',true,true,p_owner) returning id into v_ceo;
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, created_by)
    values (p_ws,'worker','Worker','Operational access, scoped by assignment',false,true,p_owner) returning id into v_worker;
  insert into public.roles (workspace_id, key, name, description, grants_all, is_system, is_client, created_by)
    values (p_ws,'client','Client','Client portal access',false,true,true,p_owner) returning id into v_client;
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

-- Tables --------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  name          text not null,
  number        text,
  status        text not null default 'active'
                check (status in ('active','on_hold','completed','archived')),
  description   text,
  start_date    date, due_date date,
  budget        numeric(14,2),
  health_score  int check (health_score between 0 and 100),
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member',
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (project_id, profile_id)
);

create table if not exists public.milestones (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  title        text not null, due_date date, position int not null default 0,
  status       text not null default 'open' check (status in ('open','done')),
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  milestone_id   uuid references public.milestones(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title          text not null, description text,
  status         text not null default 'todo'
                 check (status in ('todo','in_progress','in_review','done')),
  priority       text not null default 'medium'
                 check (priority in ('low','medium','high','urgent')),
  assignee_id    uuid references public.profiles(id) on delete set null,
  due_at         timestamptz, estimate_minutes int, position int not null default 0,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.task_followers (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

create table if not exists public.task_dependencies (
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  task_id           uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table if not exists public.task_checklist_items (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  content      text not null, is_done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.task_comments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  body         text not null, is_internal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.task_time_entries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  minutes      int not null check (minutes >= 0),
  started_at   timestamptz, note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.files (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  bucket           text not null default 'project-files',
  storage_key      text not null,
  name             text not null, mime_type text, size_bytes bigint,
  version          int not null default 1,
  is_client_visible boolean not null default false,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.approvals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  title        text not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_by uuid references public.profiles(id) on delete set null,
  decided_by   uuid references public.profiles(id) on delete set null,
  decided_at   timestamptz, note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create index if not exists projects_ws_status_idx on public.projects (workspace_id, status) where deleted_at is null;
create index if not exists projects_client_idx    on public.projects (client_id);
create index if not exists project_members_project_idx on public.project_members (project_id);
create index if not exists project_members_profile_idx on public.project_members (profile_id);
create index if not exists tasks_project_idx on public.tasks (project_id) where deleted_at is null;
create index if not exists tasks_assignee_idx on public.tasks (assignee_id) where deleted_at is null;
create index if not exists files_project_idx on public.files (project_id) where deleted_at is null;

select app.attach_updated_at('public.projects');
select app.attach_updated_at('public.project_members');
select app.attach_updated_at('public.milestones');
select app.attach_updated_at('public.tasks');
select app.attach_updated_at('public.task_checklist_items');
select app.attach_updated_at('public.task_comments');
select app.attach_updated_at('public.task_time_entries');
select app.attach_updated_at('public.files');
select app.attach_updated_at('public.approvals');

-- Access helpers ------------------------------------------------------------
create or replace function app.is_client(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members wm
    join public.roles r on r.id = wm.role_id
    where wm.workspace_id = p_workspace and wm.profile_id = auth.uid()
      and wm.status = 'active' and wm.deleted_at is null and r.is_client
  );
$$;

create or replace function app.can_access_project(p_project uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.deleted_at is null and (
      app.is_admin(p.workspace_id)
      or exists (select 1 from public.project_members pm
                 where pm.project_id = p.id and pm.profile_id = auth.uid() and pm.deleted_at is null)
      or (p.client_id is not null and app.is_client_contact(p.client_id))
    )
  );
$$;

-- RLS -----------------------------------------------------------------------
alter table public.projects             enable row level security;
alter table public.project_members      enable row level security;
alter table public.milestones           enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_followers       enable row level security;
alter table public.task_dependencies    enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_comments        enable row level security;
alter table public.task_time_entries    enable row level security;
alter table public.files                enable row level security;
alter table public.approvals            enable row level security;

-- projects: viewable with projects.view + project access; managed with
-- projects.manage + project access (create allowed for managers).
create policy projects_select on public.projects for select
  using (app.has_permission(workspace_id,'projects.view') and app.can_access_project(id));
create policy projects_insert on public.projects for insert
  with check (app.has_permission(workspace_id,'projects.manage'));
create policy projects_update on public.projects for update
  using (app.has_permission(workspace_id,'projects.manage') and app.can_access_project(id))
  with check (app.has_permission(workspace_id,'projects.manage'));
create policy projects_delete on public.projects for delete
  using (app.is_admin(workspace_id));

create policy project_members_select on public.project_members for select
  using (app.can_access_project(project_id));
create policy project_members_write on public.project_members for all
  using (app.has_permission(workspace_id,'projects.manage'))
  with check (app.has_permission(workspace_id,'projects.manage'));

create policy milestones_select on public.milestones for select
  using (app.has_permission(workspace_id,'projects.view') and app.can_access_project(project_id));
create policy milestones_write on public.milestones for all
  using (app.has_permission(workspace_id,'projects.manage') and app.can_access_project(project_id))
  with check (app.has_permission(workspace_id,'projects.manage') and app.can_access_project(project_id));

-- tasks + children: gated by tasks.* (clients lack tasks.view, so hidden).
create policy tasks_select on public.tasks for select
  using (app.has_permission(workspace_id,'tasks.view') and app.can_access_project(project_id));
create policy tasks_write on public.tasks for all
  using (app.has_permission(workspace_id,'tasks.manage') and app.can_access_project(project_id))
  with check (app.has_permission(workspace_id,'tasks.manage') and app.can_access_project(project_id));

create policy task_followers_all on public.task_followers for all
  using (exists (select 1 from public.tasks t where t.id = task_id
    and app.has_permission(t.workspace_id,'tasks.view') and app.can_access_project(t.project_id)))
  with check (exists (select 1 from public.tasks t where t.id = task_id
    and app.has_permission(t.workspace_id,'tasks.manage') and app.can_access_project(t.project_id)));

create policy task_dependencies_all on public.task_dependencies for all
  using (exists (select 1 from public.tasks t where t.id = task_id
    and app.has_permission(t.workspace_id,'tasks.view') and app.can_access_project(t.project_id)))
  with check (exists (select 1 from public.tasks t where t.id = task_id
    and app.has_permission(t.workspace_id,'tasks.manage') and app.can_access_project(t.project_id)));

create policy checklist_select on public.task_checklist_items for select
  using (app.has_permission(workspace_id,'tasks.view')
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)));
create policy checklist_write on public.task_checklist_items for all
  using (app.has_permission(workspace_id,'tasks.manage')
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)))
  with check (app.has_permission(workspace_id,'tasks.manage')
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)));

create policy task_comments_select on public.task_comments for select
  using (app.has_permission(workspace_id,'tasks.view')
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)));
create policy task_comments_write on public.task_comments for all
  using (app.has_permission(workspace_id,'tasks.view') and author_id = auth.uid())
  with check (app.has_permission(workspace_id,'tasks.view') and author_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)));

create policy time_entries_select on public.task_time_entries for select
  using (app.has_permission(workspace_id,'tasks.view')
    and exists (select 1 from public.tasks t where t.id = task_id and app.can_access_project(t.project_id)));
create policy time_entries_write on public.task_time_entries for all
  using (app.has_permission(workspace_id,'tasks.view') and profile_id = auth.uid())
  with check (app.has_permission(workspace_id,'tasks.view') and profile_id = auth.uid());

-- files: staff see all in accessible projects + workspace files; clients see
-- only client-visible files in their projects.
create policy files_select on public.files for select
  using (
    app.has_permission(workspace_id,'files.view')
    and (project_id is null or app.can_access_project(project_id))
    and (project_id is not null or not app.is_client(workspace_id))
    and (is_client_visible or not app.is_client(workspace_id))
  );
create policy files_write on public.files for all
  using (app.has_permission(workspace_id,'files.manage')
    and (project_id is null or app.can_access_project(project_id)))
  with check (app.has_permission(workspace_id,'files.manage')
    and (project_id is null or app.can_access_project(project_id)));

create policy approvals_select on public.approvals for select
  using (app.has_permission(workspace_id,'projects.view') and app.can_access_project(project_id));
create policy approvals_write on public.approvals for all
  using (app.has_permission(workspace_id,'projects.manage') and app.can_access_project(project_id))
  with check (app.has_permission(workspace_id,'projects.manage') and app.can_access_project(project_id));
