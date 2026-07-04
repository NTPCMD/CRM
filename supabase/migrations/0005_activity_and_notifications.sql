-- 0005_activity_and_notifications.sql
-- Volume 2 §20-§21, Volume 4 §6 — the append-only activity log and the
-- notification table, plus the log_activity() helper.

-- Immutable, append-only audit trail (no updated_at / no soft delete). -------
create table if not exists public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null,                 -- e.g. 'task.completed'
  object_type  text,                          -- e.g. 'task'
  object_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists activity_logs_workspace_time_idx
  on public.activity_logs (workspace_id, created_at desc);
create index if not exists activity_logs_object_idx
  on public.activity_logs (object_type, object_id);

-- Append an activity event. SECURITY DEFINER so services/triggers can write it
-- regardless of the caller's direct table privileges.
create or replace function app.log_activity(
  p_workspace   uuid,
  p_action      text,
  p_object_type text default null,
  p_object_id   uuid default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.activity_logs
    (workspace_id, actor_id, action, object_type, object_id, metadata)
  values
    (p_workspace, auth.uid(), p_action, p_object_type, p_object_id,
     coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- Notifications --------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type         text not null,                 -- 'task','invoice','message',...
  title        text not null,
  body         text,
  channel      text not null default 'in_app'
               check (channel in ('in_app','email','push','sms')),
  status       text not null default 'unread'
               check (status in ('unread','read','sent')),
  read_at      timestamptz,
  data         jsonb not null default '{}'::jsonb,
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, status) where deleted_at is null;

select app.attach_updated_at('public.notifications');

-- Create a notification for a recipient.
create or replace function app.create_notification(
  p_workspace   uuid,
  p_recipient   uuid,
  p_type        text,
  p_title       text,
  p_body        text default null,
  p_channel     text default 'in_app',
  p_data        jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.notifications
    (workspace_id, recipient_id, type, title, body, channel, data)
  values
    (p_workspace, p_recipient, p_type, p_title, p_body, p_channel,
     coalesce(p_data, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;
