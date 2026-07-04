# AgencyOS — Volume 2: Database Architecture & Supabase Specification

**Version:** 1.0

This volume is the **authoritative specification for the physical data layer**.
Where it differs from the conceptual model in
[Volume 1's data model](data-model.md), this document wins. Notably, Volume 2
ratifies the backend (Supabase / PostgreSQL 17) and adopts **`workspace`** as the
canonical name for the isolation boundary that Volume 1 called the *tenant*.

> **Terminology reconciliation:** `workspace` (Vol. 2) ≡ `tenant`/`agency`
> (Vol. 1). Every business table carries `workspace_id`.

---

## 1. Database Philosophy

AgencyOS uses a **workspace-first architecture**. Everything belongs to a
workspace, so a single installation can serve agencies, freelancers,
enterprises, and franchises alike. Every table ultimately links back to a
`workspace`.

```
Workspace
├── Clients
├── Workers
├── Projects
├── Invoices
├── Contracts
├── Calendar
├── Messages
├── AI
└── Files
```

## 2. Database Standards

| Concern       | Standard                                                        |
| ------------- | -------------------------------------------------------------- |
| Engine        | **PostgreSQL 17**                                              |
| Backend       | **Supabase**                                                  |
| Capabilities  | Realtime · Storage · Edge Functions · Auth · RLS · Full-Text Search |

## 3. Naming Conventions

- Tables: `snake_case`, plural (`projects`, `client_contacts`).
- Columns: `snake_case`.
- Primary keys: `id`.
- Foreign keys: `<entity>_id` (`project_id`, `workspace_id`).
- Booleans: `is_` / `has_` prefixes.
- Timestamps: `_at` suffix (`created_at`, `deleted_at`).
- Enumerations: dedicated lookup tables or Postgres enums (`status`, `role`).

## 4. Primary Key Standard — UUID

Every table uses **`UUID`** primary keys, never integers.

Rationale: harder to enumerate, distribution-friendly, easier merges, and
API-friendly.

## 5. Audit Fields (every table)

```
id            uuid   primary key
workspace_id  uuid   -> workspaces.id
created_at    timestamptz
updated_at    timestamptz
created_by    uuid   -> profiles.id
updated_by    uuid   -> profiles.id
deleted_at    timestamptz  (nullable)
```

**Soft delete only** — never hard-delete business data. `deleted_at IS NULL`
means live; RLS and views filter deleted rows out by default.

## 6. Database Layers (logical domains)

Each domain owns an isolated set of tables:

```
Authentication → Organizations (Workspaces) → Users → CRM → Projects →
Tasks → Messaging → Finance → Calendar → AI → Logs → Settings
```

## 7. Authentication

- Supabase Auth owns `auth.users` — **never modify it directly**.
- A `profiles` table is linked 1:1 to `auth.users.id` and stores application
  identity: avatar, phone, timezone, language, job title, notification
  preferences.

## 8. Entity Relationship Overview

```
workspaces 1───* profiles
workspaces 1───* clients ───* client_contacts / client_addresses / client_tags
workspaces 1───* projects ───* milestones ───* tasks ───* subtasks
                                   │              └───* task_comments / task_checklist_items
                                   ├───* project_files ───* approvals
                                   └───* activity (per project)
workspaces 1───* conversations ───* messages ───* attachments / reactions / read_receipts
workspaces 1───* invoices ───* invoice_items / payments / taxes / discounts
workspaces 1───* contracts ───* contract_versions / signatures
workspaces 1───* calendar_events (meetings / deadlines / availability / invites)
workspaces 1───* meetings ───* transcripts / action_items
workspaces 1───* ai_threads ───* ai_messages ; ai_context / ai_embeddings / ai_jobs
workspaces 1───* activity_logs   (append-only)
workspaces 1───* notifications
roles ───* role_permissions ───* permissions ; profiles ───* user_permissions
```

## 9. Core Tables

### 9.1 workspaces

`id, name, slug, logo, plan, status, timezone, country, created_at, updated_at`

Every record in the database belongs to exactly one workspace.

### 9.2 profiles (Users)

`id, workspace_id, first_name, last_name, email, phone, avatar, role_id,
status, last_seen, created_at`

Linked to `auth.users.id`. Note `role_id` (FK) rather than a hardcoded role
string — see §10.

### 9.3 Roles & Permissions — §10

### 9.4 Clients — §11

### 9.5 Projects / Tasks — §12–13

### 9.6 Messaging — §14

### 9.7 Calendar — §15

### 9.8 Finance (Invoices) — §16

### 9.9 Contracts — §17

### 9.10 Meeting Notes — §18

### 9.11 AI — §19

## 10. Roles & Permission Model

Roles are **data, not code**. Instead of fixed `CEO / Worker / Client` strings,
`profiles.role_id` references a `roles` row, allowing future roles (Manager,
Sales, Designer, Developer, Editor, Finance, Contractor, …).

Permissions are never hardcoded. Four tables model authorization:

| Table              | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `permissions`      | Catalog of capability strings.                      |
| `roles`            | Named roles per workspace.                           |
| `role_permissions` | Which permissions each role grants (baseline).      |
| `user_permissions` | Per-user grant/revoke overrides on top of the role. |

Example permission strings:

```
projects.view   projects.edit    projects.delete
tasks.create    tasks.assign
clients.view    clients.edit
billing.create  billing.delete
contracts.sign  calendar.edit    settings.manage
```

Application **middleware** resolves effective permissions from these tables on
every request. This is the physical realization of Volume 1's
[Permission Matrix](permission-matrix.md).

## 11. Clients

**Clients are not users.** A client becomes a user only when explicitly invited
(creating a `profiles` row with a client role linked to their `auth.users`).

Tables: `clients`, `client_contacts`, `client_addresses`, `client_tags`.

## 12. Projects Hierarchy

```
Project → Milestones → Tasks → Subtasks → Comments → Files → Approvals → Activity
```

Each level references its parent. Files and approvals attach at the project/task
level; activity is recorded per project.

## 13. Tasks

Tasks support: **priority, status, assignee, followers, dependencies, time
tracking, recurring rules, checklists, attachments.** Modeled with supporting
tables (`task_followers`, `task_dependencies`, `task_time_entries`,
`task_checklist_items`, `task_attachments`) rather than overloaded columns.

## 14. Messaging

```
Conversation → Participants → Messages → Attachments → Reactions → Read Receipts
```

Realtime-enabled (see §21). Internal conversations/messages are never exposed to
clients.

## 15. Calendar

Entities: `events`, `meetings`, `deadlines`, `availability`, `invites`,
`recurring_rules`. Google Calendar sync is deferred.

## 16. Invoices (Finance)

```
Invoice → Items → Payments → Taxes → Discounts → PDF → History
```

**Never store computed totals as the source of truth — always calculate** from
line items, taxes, and discounts (see `calculate_invoice_total()` in §25). A
snapshot/PDF may be persisted for the historical record.

## 17. Contracts

```
Contract → Versions → Signatures → Files → Audit Trail
```

## 18. Meeting Notes

```
Meeting → Transcript → Summary → AI Summary → Action Items → Follow-ups
```

Saving a transcript queues an AI summarization job (see §26).

## 19. AI Tables (isolated)

AI data lives in its own tables so providers can be swapped without touching
business data:

```
ai_threads   ai_messages   ai_context   ai_embeddings   ai_jobs
```

`ai_embeddings` uses `pgvector` for semantic search layered on top of full-text
search (§23).

## 20. Activity Log Architecture

Every meaningful action creates an **immutable, append-only** event
(`activity_logs`). No updates, no deletes.

Each entry stores: **actor, object, action, timestamp, metadata (jsonb).**

Example lifecycle: `task.created → task.assigned → task.edited →
task.completed → invoice.generated → invoice.paid`.

## 21. Realtime Architecture

Supabase Realtime broadcasts changes on subscribed tables (messaging,
notifications, tasks, activity). Subscriptions are **permission-filtered by
RLS**, so a client only receives changes for rows it is authorized to read.

## 22. Notifications

```
Notification → Recipient → Channel → Status → Read Timestamp
```

Channels: In-app, Email, Push, SMS (future). Notifications are generated by
triggers (task assigned, new message) and by `create_notification()`.

## 23. Storage Architecture

Supabase Storage buckets:

```
avatars   project-files   contracts   invoices
meeting-recordings   temp   exports
```

**Never expose bucket URLs directly — always issue signed URLs.** Bucket access
is governed by storage policies mirroring table RLS.

## 24. Full-Text Search

PostgreSQL Full-Text Search (`tsvector` columns + GIN indexes) powers search over
Projects, Clients, Tasks, Messages, Meeting Notes, and Contracts. AI semantic
search via `ai_embeddings` (§19) layers on later.

## 25. Row Level Security (RLS) Strategy

Every business table has `workspace_id` and RLS enabled. **Deny by default** —
grant nothing until a policy allows it. Access is filtered by:

1. **Workspace membership** — the row's `workspace_id` matches the caller's.
2. **Role** — the caller's role grants the capability.
3. **Explicit permissions** — `user_permissions` overrides.
4. **Ownership / assignment** — for row-scoped access (e.g. project membership).

Effective access by role within a workspace:

- **CEO** — unrestricted within their workspace.
- **Worker** — only records permitted by role and project assignment.
- **Client** — only records associated with their own organization and
  projects; never internal data or other clients' data.

This "deny by default" posture is safer than granting broadly and restricting
after the fact.

## 26. Database Functions

Business logic that must stay consistent across all clients lives in database
functions, not only in frontend code:

| Function                     | Responsibility                                  |
| ---------------------------- | ----------------------------------------------- |
| `create_workspace()`         | Provision a workspace and its owner.            |
| `invite_user()`              | Invite a worker/client, wiring auth + profile.  |
| `archive_project()`          | Soft-archive a project and dependents.          |
| `calculate_invoice_total()`  | Compute totals from items/taxes/discounts.      |
| `log_activity()`             | Append an immutable activity event.             |
| `create_notification()`      | Fan a notification to recipient/channel.        |
| `assign_task()`              | Assign a task and notify the assignee.          |
| `duplicate_project()`        | Deep-copy a project template.                   |
| `generate_project_number()`  | Sequential, workspace-scoped project numbers.   |
| `generate_invoice_number()`  | Sequential, workspace-scoped invoice numbers.   |

## 27. Triggers

- `set_updated_at` — bump `updated_at` on every row change.
- `write_activity_log` — append activity after insert/update/soft-delete.
- `notify_on_assignment` / `notify_on_message` — create notifications.
- `assign_invoice_number` — generate invoice number on insert.
- `queue_ai_summary` — enqueue an `ai_jobs` row when a transcript is saved.

## 28. Views

Reporting/dashboard views keep application queries efficient:

- Active projects
- Overdue tasks
- Monthly revenue
- Worker utilization
- Client project summaries
- Outstanding invoices
- Upcoming meetings
- Recent activity

All views respect RLS and exclude soft-deleted rows.

## 29. Indexing Strategy

- Every FK column is indexed (`workspace_id` first — it prefixes most queries).
- Composite indexes for common filters (e.g. `(workspace_id, status)` on
  projects/tasks; `(workspace_id, created_at)` for activity feeds).
- GIN indexes for full-text `tsvector` columns and `jsonb` metadata.
- `pgvector` (IVFFlat/HNSW) index for `ai_embeddings`.
- Partial indexes on `deleted_at IS NULL` for hot live-row lookups.

## 30. Performance Guidelines

- Filter by `workspace_id` in every query so RLS and indexes short-circuit early.
- Prefer set-based SQL and views over N+1 application queries.
- Keep heavy aggregation in views/materialized views, refreshed on a schedule.
- Store large binaries in Storage, not the database — reference by `storage_key`.

## 31. Reconciliation with Volume 1

| Volume 1 said | Volume 2 ratifies |
| ------------- | ----------------- |
| Generic PostgreSQL, pluggable auth | **PostgreSQL 17 on Supabase; Supabase Auth** |
| `tenant_id` isolation boundary | **`workspace_id`** (same concept) |
| Central authorization service | **RLS + `permissions`/`roles`/`user_permissions` + middleware** |
| Conceptual entities | Concrete tables with UUIDs, audit fields, soft delete |
| Realtime engine (WebSocket) | **Supabase Realtime** |
| Object storage | **Supabase Storage** with signed URLs |

## 32. Future Expansion (→ Volume 3)

Volume 3 maps every database entity to the user experience: CEO / Worker /
Client portals, navigation, screens, modals, dashboard widgets, component
hierarchy, user flows, and the design system.
</content>
