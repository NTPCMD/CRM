-- 0015_ai.sql
-- Volume 2 §19 — AI data isolated from business tables so providers can be
-- swapped. Threads are owner-scoped; embeddings/jobs are workspace-internal.
--
-- The embeddings column uses pgvector when available (Supabase) and falls back
-- to jsonb otherwise (e.g. local validation), so the migration is portable.

create table if not exists public.ai_threads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  agent        text not null default 'assistant',
  title        text,
  context      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.ai_messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id    uuid not null references public.ai_threads(id) on delete cascade,
  role         text not null check (role in ('user','assistant','system','tool')),
  content      text not null,
  tokens       int,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_context (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id    uuid references public.ai_threads(id) on delete cascade,
  kind         text, ref_type text, ref_id uuid, content text,
  created_at timestamptz not null default now()
);

do $$
declare has_vec boolean := exists (select 1 from pg_available_extensions where name = 'vector');
begin
  if has_vec then execute 'create extension if not exists vector'; end if;
  execute format($f$
    create table if not exists public.ai_embeddings (
      id           uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      ref_type     text, ref_id uuid,
      content      text,
      embedding    %s,
      created_at   timestamptz not null default now()
    )$f$, case when has_vec then 'vector(1536)' else 'jsonb' end);
end $$;

create table if not exists public.ai_jobs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind         text not null,
  status       text not null default 'queued' check (status in ('queued','running','done','error')),
  payload      jsonb not null default '{}'::jsonb,
  result       jsonb, error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_threads_owner_idx on public.ai_threads (workspace_id, profile_id) where deleted_at is null;
create index if not exists ai_messages_thread_idx on public.ai_messages (thread_id, created_at);
create index if not exists ai_jobs_status_idx on public.ai_jobs (workspace_id, status);

select app.attach_updated_at('public.ai_threads');
select app.attach_updated_at('public.ai_jobs');

alter table public.ai_threads    enable row level security;
alter table public.ai_messages   enable row level security;
alter table public.ai_context    enable row level security;
alter table public.ai_embeddings enable row level security;
alter table public.ai_jobs       enable row level security;

-- Threads belong to their owner; admins may review within the workspace.
create policy ai_threads_select on public.ai_threads for select
  using (profile_id = auth.uid() or app.is_admin(workspace_id));
create policy ai_threads_write on public.ai_threads for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and app.is_member(workspace_id));

create policy ai_messages_select on public.ai_messages for select
  using (exists (select 1 from public.ai_threads t where t.id = thread_id
    and (t.profile_id = auth.uid() or app.is_admin(t.workspace_id))));
create policy ai_messages_write on public.ai_messages for all
  using (exists (select 1 from public.ai_threads t where t.id = thread_id and t.profile_id = auth.uid()))
  with check (exists (select 1 from public.ai_threads t where t.id = thread_id and t.profile_id = auth.uid()));

create policy ai_context_select on public.ai_context for select
  using (exists (select 1 from public.ai_threads t where t.id = thread_id
    and (t.profile_id = auth.uid() or app.is_admin(t.workspace_id))));

-- Embeddings and jobs are workspace-internal (staff/admin); writes go through
-- SECURITY DEFINER services, so only read policies are defined here.
create policy ai_embeddings_select on public.ai_embeddings for select
  using (app.is_admin(workspace_id));
create policy ai_jobs_select on public.ai_jobs for select
  using (app.is_admin(workspace_id));
