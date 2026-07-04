-- 0008_crm.sql
-- Volume 2 §11 — CRM: clients (not users until invited), their contacts /
-- addresses / tags, and leads (pipeline).

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  type          text not null default 'company' check (type in ('company','individual')),
  status        text not null default 'active' check (status in ('active','archived')),
  website       text,
  notes         text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by    uuid, updated_by uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.client_contacts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  profile_id   uuid references public.profiles(id) on delete set null, -- set when invited
  first_name   text, last_name text,
  email        citext, phone text, title text,
  is_primary   boolean not null default false,
  created_by   uuid, updated_by uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table if not exists public.client_addresses (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  label        text, line1 text, line2 text, city text,
  state        text, postal_code text, country text,
  created_by   uuid, updated_by uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table if not exists public.client_tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  tag          text not null,
  created_at   timestamptz not null default now(),
  unique (client_id, tag)
);

create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  name                text not null,
  company             text, email citext, phone text,
  stage               text not null default 'lead'
                      check (stage in ('lead','qualified','proposal','negotiation','won','lost')),
  value               numeric(14,2) default 0,
  source              text,
  owner_id            uuid references public.profiles(id) on delete set null,
  notes               text,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_by          uuid, updated_by uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists clients_ws_idx        on public.clients (workspace_id) where deleted_at is null;
create index if not exists client_contacts_client_idx on public.client_contacts (client_id);
create index if not exists client_contacts_profile_idx on public.client_contacts (profile_id);
create index if not exists client_addresses_client_idx on public.client_addresses (client_id);
create index if not exists leads_ws_stage_idx    on public.leads (workspace_id, stage) where deleted_at is null;

select app.attach_updated_at('public.clients');
select app.attach_updated_at('public.client_contacts');
select app.attach_updated_at('public.client_addresses');
select app.attach_updated_at('public.leads');

-- Is the current user a portal user for this client? (own-client visibility)
create or replace function app.is_client_contact(p_client uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.client_contacts cc
    where cc.client_id = p_client
      and cc.profile_id = auth.uid()
      and cc.deleted_at is null
  );
$$;

-- RLS -----------------------------------------------------------------------
alter table public.clients          enable row level security;
alter table public.client_contacts  enable row level security;
alter table public.client_addresses enable row level security;
alter table public.client_tags      enable row level security;
alter table public.leads            enable row level security;

-- clients: staff via crm.*, plus the client's own portal users may read theirs
create policy clients_select on public.clients for select
  using (app.has_permission(workspace_id, 'crm.view') or app.is_client_contact(id));
create policy clients_write on public.clients for all
  using (app.has_permission(workspace_id, 'crm.manage'))
  with check (app.has_permission(workspace_id, 'crm.manage'));

create policy client_contacts_select on public.client_contacts for select
  using (app.has_permission(workspace_id, 'crm.view') or app.is_client_contact(client_id));
create policy client_contacts_write on public.client_contacts for all
  using (app.has_permission(workspace_id, 'crm.manage'))
  with check (app.has_permission(workspace_id, 'crm.manage'));

create policy client_addresses_select on public.client_addresses for select
  using (app.has_permission(workspace_id, 'crm.view') or app.is_client_contact(client_id));
create policy client_addresses_write on public.client_addresses for all
  using (app.has_permission(workspace_id, 'crm.manage'))
  with check (app.has_permission(workspace_id, 'crm.manage'));

create policy client_tags_select on public.client_tags for select
  using (app.has_permission(workspace_id, 'crm.view'));
create policy client_tags_write on public.client_tags for all
  using (app.has_permission(workspace_id, 'crm.manage'))
  with check (app.has_permission(workspace_id, 'crm.manage'));

-- leads: staff only
create policy leads_select on public.leads for select
  using (app.has_permission(workspace_id, 'crm.view'));
create policy leads_write on public.leads for all
  using (app.has_permission(workspace_id, 'crm.manage'))
  with check (app.has_permission(workspace_id, 'crm.manage'));
