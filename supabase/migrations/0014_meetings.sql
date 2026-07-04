-- 0014_meetings.sql
-- Volume 2 §18 — meeting notes with AI summaries and action items. Clients see
-- only client-visible meetings on their accessible projects.

create table if not exists public.meetings (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete cascade,
  event_id     uuid references public.calendar_events(id) on delete set null,
  title        text not null,
  agenda       text, notes text,
  ai_summary   text, recording_url text,
  visibility   text not null default 'internal' check (visibility in ('internal','client')),
  occurred_at  timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.meeting_action_items (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  meeting_id   uuid not null references public.meetings(id) on delete cascade,
  content      text not null,
  assignee_id  uuid references public.profiles(id) on delete set null,
  task_id      uuid references public.tasks(id) on delete set null,
  is_done      boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_ws_time_idx on public.meetings (workspace_id, occurred_at) where deleted_at is null;
create index if not exists meetings_project_idx on public.meetings (project_id);
create index if not exists meeting_action_items_meeting_idx on public.meeting_action_items (meeting_id);

select app.attach_updated_at('public.meetings');

alter table public.meetings             enable row level security;
alter table public.meeting_action_items enable row level security;

create policy meetings_select on public.meetings for select
  using (
    app.has_permission(workspace_id,'meetingnotes.view')
    and (project_id is null or app.can_access_project(project_id))
    and (project_id is not null or not app.is_client(workspace_id))
    and (visibility = 'client' or not app.is_client(workspace_id))
  );
select app.write_policies('public.meetings',
  $$app.has_permission(workspace_id,'meetingnotes.manage')
    and (project_id is null or app.can_access_project(project_id))$$,
  $$app.has_permission(workspace_id,'meetingnotes.manage')
    and (project_id is null or app.can_access_project(project_id))$$);

create policy action_items_select on public.meeting_action_items for select
  using (exists (select 1 from public.meetings m where m.id = meeting_id
    and app.has_permission(m.workspace_id,'meetingnotes.view')
    and (m.project_id is null or app.can_access_project(m.project_id))
    and (m.visibility = 'client' or not app.is_client(m.workspace_id))));
select app.write_policies('public.meeting_action_items',
  $$app.has_permission(workspace_id,'meetingnotes.manage')$$,
  $$app.has_permission(workspace_id,'meetingnotes.manage')$$);
