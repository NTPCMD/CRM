-- 0012_finance.sql
-- Volume 2 §16 — invoices with line items, taxes, discounts, and payments.
-- Totals are always CALCULATED (never stored as source of truth). Clients see
-- only invoices tied to their own client record.

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  number       text,
  status       text not null default 'draft'
               check (status in ('draft','review','sent','viewed','paid','archived')),
  currency     text not null default 'USD',
  issue_date   date, due_date date, notes text,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  description  text not null,
  quantity     numeric(14,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  position     int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_taxes (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  name         text not null,
  rate         numeric(6,3) not null default 0,   -- percent, e.g. 10.000
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_discounts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  name         text not null,
  kind         text not null default 'percent' check (kind in ('percent','fixed')),
  amount       numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount       numeric(14,2) not null,
  provider     text, provider_ref text,
  paid_at      timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists invoices_ws_status_idx on public.invoices (workspace_id, status) where deleted_at is null;
create index if not exists invoices_client_idx on public.invoices (client_id);
create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists payments_invoice_idx on public.payments (invoice_id);

select app.attach_updated_at('public.invoices');
select app.attach_updated_at('public.invoice_items');

-- Calculate the total for an invoice from items, then discounts, then taxes.
create or replace function public.calculate_invoice_total(p_invoice uuid)
returns numeric
language sql stable security definer set search_path = public, pg_temp
as $$
  with sub as (
    select coalesce(sum(quantity * unit_price), 0) as subtotal
    from public.invoice_items where invoice_id = p_invoice
  ),
  disc as (
    select coalesce(sum(
      case when kind = 'percent' then (select subtotal from sub) * amount / 100
           else amount end), 0) as discount_total
    from public.invoice_discounts where invoice_id = p_invoice
  ),
  base as (
    select greatest((select subtotal from sub) - (select discount_total from disc), 0) as net
  ),
  tax as (
    select coalesce(sum((select net from base) * rate / 100), 0) as tax_total
    from public.invoice_taxes where invoice_id = p_invoice
  )
  select (select net from base) + (select tax_total from tax);
$$;

-- Totals view (RLS of the querying user applies via security_invoker).
create or replace view public.invoice_totals
  with (security_invoker = true) as
  select i.id as invoice_id,
         i.workspace_id,
         coalesce((select sum(quantity * unit_price) from public.invoice_items it where it.invoice_id = i.id), 0) as subtotal,
         public.calculate_invoice_total(i.id) as total
  from public.invoices i;

alter table public.invoices          enable row level security;
alter table public.invoice_items     enable row level security;
alter table public.invoice_taxes     enable row level security;
alter table public.invoice_discounts enable row level security;
alter table public.payments          enable row level security;

-- Invoices: staff via invoices.view; clients restricted to their own client.
create policy invoices_select on public.invoices for select
  using (app.has_permission(workspace_id,'invoices.view')
    and (not app.is_client(workspace_id) or app.is_client_contact(client_id)));
select app.write_policies('public.invoices',
  $$app.has_permission(workspace_id,'invoices.manage')$$,
  $$app.has_permission(workspace_id,'invoices.manage')$$);

-- Child tables inherit access from the parent invoice.
create policy invoice_items_select on public.invoice_items for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id
    and app.has_permission(i.workspace_id,'invoices.view')
    and (not app.is_client(i.workspace_id) or app.is_client_contact(i.client_id))));
select app.write_policies('public.invoice_items',
  $$app.has_permission(workspace_id,'invoices.manage')$$,
  $$app.has_permission(workspace_id,'invoices.manage')$$);

create policy invoice_taxes_select on public.invoice_taxes for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id
    and app.has_permission(i.workspace_id,'invoices.view')
    and (not app.is_client(i.workspace_id) or app.is_client_contact(i.client_id))));
select app.write_policies('public.invoice_taxes',
  $$app.has_permission(workspace_id,'invoices.manage')$$,
  $$app.has_permission(workspace_id,'invoices.manage')$$);

create policy invoice_discounts_select on public.invoice_discounts for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id
    and app.has_permission(i.workspace_id,'invoices.view')
    and (not app.is_client(i.workspace_id) or app.is_client_contact(i.client_id))));
select app.write_policies('public.invoice_discounts',
  $$app.has_permission(workspace_id,'invoices.manage')$$,
  $$app.has_permission(workspace_id,'invoices.manage')$$);

create policy payments_select on public.payments for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id
    and app.has_permission(i.workspace_id,'invoices.view')
    and (not app.is_client(i.workspace_id) or app.is_client_contact(i.client_id))));
select app.write_policies('public.payments',
  $$app.has_permission(workspace_id,'invoices.manage')$$,
  $$app.has_permission(workspace_id,'invoices.manage')$$);
