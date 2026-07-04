-- 0011_calendar.sql
-- Volume 2 §15 — calendar events (meetings, deadlines, events, reviews,
-- availability) and invites. Clients see only client-visible events on their
-- accessible projects.

create table if not exists public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete cascade,
  title           text not null, description text,
  type            text not null default 'event'
                  check (type in ('meeting','deadline','event','review','availability')),
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  all_day         boolean not null default false,
  location        text,
  visibility      text not null default 'internal' check (visibility in ('internal','client')),
  recurrence_rule text,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.event_invites (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  event_id         uuid not null references public.calendar_events(id) on delete cascade,
  profile_id       uuid references public.profiles(id) on delete cascade,
  client_contact_id uuid references public.client_contacts(id) on delete cascade,
  response         text not null default 'pending' check (response in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_ws_time_idx on public.calendar_events (workspace_id, starts_at) where deleted_at is null;
create index if not exists calendar_events_project_idx on public.calendar_events (project_id);
create index if not exists event_invites_event_idx on public.event_invites (event_id);

select app.attach_updated_at('public.calendar_events');

alter table public.calendar_events enable row level security;
alter table public.event_invites   enable row level security;

create policy calendar_select on public.calendar_events for select
  using (
    app.has_permission(workspace_id,'calendar.view')
    and (project_id is null or app.can_access_project(project_id))
    and (project_id is not null or not app.is_client(workspace_id))
    and (visibility = 'client' or not app.is_client(workspace_id))
  );
select app.write_policies('public.calendar_events',
  $$app.has_permission(workspace_id,'calendar.manage')
    and (project_id is null or app.can_access_project(project_id))$$,
  $$app.has_permission(workspace_id,'calendar.manage')
    and (project_id is null or app.can_access_project(project_id))$$);

create policy event_invites_select on public.event_invites for select
  using (exists (select 1 from public.calendar_events e where e.id = event_id
    and app.has_permission(e.workspace_id,'calendar.view')
    and (e.project_id is null or app.can_access_project(e.project_id))));
select app.write_policies('public.event_invites',
  $$app.has_permission(workspace_id,'calendar.manage')$$,
  $$app.has_permission(workspace_id,'calendar.manage')$$);
