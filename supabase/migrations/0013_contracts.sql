-- 0013_contracts.sql
-- Volume 2 §17 — contracts with versions and signatures. Clients see their own
-- client's contracts; signing is recorded per signer.

create table if not exists public.contracts (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  title           text not null,
  status          text not null default 'draft'
                  check (status in ('draft','review','sent','viewed','signed','archived')),
  body            text,
  current_version int not null default 1,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.contract_versions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  version      int not null,
  body         text,
  file_id      uuid references public.files(id) on delete set null,
  created_by   uuid,
  created_at timestamptz not null default now(),
  unique (contract_id, version)
);

create table if not exists public.contract_signatures (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  contract_id       uuid not null references public.contracts(id) on delete cascade,
  signer_profile_id uuid references public.profiles(id) on delete set null,
  signer_contact_id uuid references public.client_contacts(id) on delete set null,
  signer_name       text, signer_email citext,
  signed_at         timestamptz, ip inet,
  created_at timestamptz not null default now()
);

create index if not exists contracts_ws_status_idx on public.contracts (workspace_id, status) where deleted_at is null;
create index if not exists contracts_client_idx on public.contracts (client_id);
create index if not exists contract_versions_contract_idx on public.contract_versions (contract_id);

select app.attach_updated_at('public.contracts');

alter table public.contracts           enable row level security;
alter table public.contract_versions   enable row level security;
alter table public.contract_signatures enable row level security;

create policy contracts_select on public.contracts for select
  using (app.has_permission(workspace_id,'contracts.view')
    and (not app.is_client(workspace_id) or app.is_client_contact(client_id)));
select app.write_policies('public.contracts',
  $$app.has_permission(workspace_id,'contracts.manage')$$,
  $$app.has_permission(workspace_id,'contracts.manage')$$);

create policy contract_versions_select on public.contract_versions for select
  using (exists (select 1 from public.contracts c where c.id = contract_id
    and app.has_permission(c.workspace_id,'contracts.view')
    and (not app.is_client(c.workspace_id) or app.is_client_contact(c.client_id))));
select app.write_policies('public.contract_versions',
  $$app.has_permission(workspace_id,'contracts.manage')$$,
  $$app.has_permission(workspace_id,'contracts.manage')$$);

-- Signatures: staff manage; clients may read their own contract's signatures
-- and add their own signature row.
create policy contract_signatures_select on public.contract_signatures for select
  using (exists (select 1 from public.contracts c where c.id = contract_id
    and app.has_permission(c.workspace_id,'contracts.view')
    and (not app.is_client(c.workspace_id) or app.is_client_contact(c.client_id))));
create policy contract_signatures_insert on public.contract_signatures for insert
  with check (
    app.has_permission(workspace_id,'contracts.manage')
    or (signer_profile_id = auth.uid()
        and exists (select 1 from public.contracts c where c.id = contract_id
          and app.is_client_contact(c.client_id)))
  );
create policy contract_signatures_modify on public.contract_signatures for update
  using (app.has_permission(workspace_id,'contracts.manage'))
  with check (app.has_permission(workspace_id,'contracts.manage'));
