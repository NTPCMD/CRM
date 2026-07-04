-- seed.sql — global, workspace-independent seed data.
-- Idempotent: safe to run repeatedly. Run once after migrations.
--
-- The permission catalog (Volume 2 §10, permission-matrix.md). Roles reference
-- these by key; app.seed_default_roles() maps them onto CEO/Worker/Client when
-- a workspace is created.

insert into public.permissions (key, module, description) values
  ('settings.manage',     'settings',     'Modify company / workspace settings'),
  ('users.manage',        'users',        'Create, disable, and edit members'),
  ('permissions.manage',  'permissions',  'Grant / revoke roles and capabilities'),
  ('crm.view',            'crm',          'View leads and pipeline'),
  ('crm.manage',          'crm',          'Manage leads and pipeline'),
  ('projects.view',       'projects',     'View projects'),
  ('projects.manage',     'projects',     'Create / update / archive projects'),
  ('tasks.view',          'tasks',        'View tasks'),
  ('tasks.manage',        'tasks',        'Create / update / assign tasks'),
  ('calendar.view',       'calendar',     'View calendar events'),
  ('calendar.manage',     'calendar',     'Create / update calendar events'),
  ('messaging.internal',  'messaging',    'Read / write internal conversations'),
  ('messaging.client',    'messaging',    'Communicate with clients'),
  ('files.view',          'files',        'View files'),
  ('files.manage',        'files',        'Upload / share / delete files'),
  ('contracts.view',      'contracts',    'View contracts'),
  ('contracts.manage',    'contracts',    'Draft / send / manage contracts'),
  ('invoices.view',       'invoices',     'View invoices'),
  ('invoices.manage',     'invoices',     'Create / send / manage invoices'),
  ('finance.view',        'finance',      'Access restricted financial data'),
  ('meetingnotes.view',   'meetings',     'View meeting notes'),
  ('meetingnotes.manage', 'meetings',     'Create / edit meeting notes'),
  ('reports.view',        'reports',      'Access dashboards and analytics'),
  ('integrations.manage', 'integrations', 'Connect / manage integrations'),
  ('automation.manage',   'automation',   'Create / manage automations'),
  ('activity.view',       'activity',     'View audit / activity logs')
on conflict (key) do update
  set module = excluded.module,
      description = excluded.description;
