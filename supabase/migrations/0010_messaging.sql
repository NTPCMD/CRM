-- 0010_messaging.sql
-- Volume 2 §14 — conversations, participants, messages, attachments,
-- reactions, and read receipts. Access is participant-based; internal
-- conversations/messages are never visible to client users.

create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete cascade,
  scope        text not null default 'internal' check (scope in ('internal','client')),
  title        text,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (conversation_id, profile_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id       uuid references public.profiles(id) on delete set null,
  body            text not null,
  is_internal     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.message_attachments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id   uuid not null references public.messages(id) on delete cascade,
  file_id      uuid references public.files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reactions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id   uuid not null references public.messages(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  emoji        text not null,
  created_at timestamptz not null default now(),
  unique (message_id, profile_id, emoji)
);

create table if not exists public.message_reads (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id   uuid not null references public.messages(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  read_at      timestamptz not null default now(),
  primary key (message_id, profile_id)
);

create index if not exists conversations_project_idx on public.conversations (project_id);
create index if not exists conv_participants_conv_idx on public.conversation_participants (conversation_id);
create index if not exists conv_participants_profile_idx on public.conversation_participants (profile_id);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

select app.attach_updated_at('public.conversations');
select app.attach_updated_at('public.conversation_participants');
select app.attach_updated_at('public.messages');

create or replace function app.is_conversation_participant(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation
      and cp.profile_id = auth.uid()
      and cp.deleted_at is null
  );
$$;

alter table public.conversations           enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                enable row level security;
alter table public.message_attachments     enable row level security;
alter table public.message_reactions       enable row level security;
alter table public.message_reads           enable row level security;

-- Participants see their conversations; client-scope required for client users.
create policy conversations_select on public.conversations for select
  using (app.is_conversation_participant(id)
    and (scope = 'client' or not app.is_client(workspace_id)));
select app.write_policies('public.conversations',
  $$app.has_permission(workspace_id,'messaging.internal')
      or app.has_permission(workspace_id,'messaging.client')$$,
  $$app.has_permission(workspace_id,'messaging.internal')
      or app.has_permission(workspace_id,'messaging.client')$$);

create policy conv_participants_select on public.conversation_participants for select
  using (app.is_conversation_participant(conversation_id));
select app.write_policies('public.conversation_participants',
  $$app.has_permission(workspace_id,'messaging.internal')
      or app.has_permission(workspace_id,'messaging.client')$$,
  $$app.has_permission(workspace_id,'messaging.internal')
      or app.has_permission(workspace_id,'messaging.client')$$);

-- Messages: participants only; internal messages hidden from client users.
create policy messages_select on public.messages for select
  using (app.is_conversation_participant(conversation_id)
    and (not is_internal or not app.is_client(workspace_id)));
create policy messages_insert on public.messages for insert
  with check (author_id = auth.uid()
    and app.is_conversation_participant(conversation_id)
    and (not is_internal or not app.is_client(workspace_id)));
create policy messages_update on public.messages for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy message_attachments_all on public.message_attachments for all
  using (exists (select 1 from public.messages m where m.id = message_id
    and app.is_conversation_participant(m.conversation_id)))
  with check (exists (select 1 from public.messages m where m.id = message_id
    and app.is_conversation_participant(m.conversation_id)));

create policy message_reactions_all on public.message_reactions for all
  using (exists (select 1 from public.messages m where m.id = message_id
    and app.is_conversation_participant(m.conversation_id)))
  with check (profile_id = auth.uid() and exists (select 1 from public.messages m
    where m.id = message_id and app.is_conversation_participant(m.conversation_id)));

create policy message_reads_all on public.message_reads for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
