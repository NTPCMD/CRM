# AgencyOS — Data Model (Conceptual)

This document describes the core entities of the shared data layer and their
relationships. It is a **conceptual model**, not a physical schema.

> **Superseded for physical detail by
> [Volume 2: Database Architecture](database-architecture.md).** Where the two
> differ, Volume 2 is authoritative. In particular, Volume 2 renames the
> isolation boundary from **`tenant`** to **`workspace`** (`tenant_id` below ≡
> `workspace_id`) and mandates UUID keys, standard audit fields, and soft
> deletes on every table.

## 1. Principles

- **Single source of truth.** Each business fact is stored once and referenced,
  never duplicated across modules.
- **Tenant isolation.** Every entity carries `tenant_id`. All access is scoped to
  a tenant.
- **Auditability.** Mutations produce `ActivityLog` entries; entities carry
  `created_at` / `updated_at` and creator attribution.
- **Soft ownership + sharing.** Access derives from role capabilities plus
  explicit resource-level sharing (notably for Clients).

## 2. Core Entities

### Tenant (Agency)

The top-level isolation boundary. Every other entity belongs to exactly one
tenant.

| Field        | Notes                                  |
| ------------ | -------------------------------------- |
| id           | Primary key                            |
| name         | Agency name                            |
| settings     | Company-wide configuration             |
| created_at   |                                        |

### User

An identity within a tenant. `role` selects the baseline capability set;
`capabilities` holds per-user overrides.

| Field        | Notes                                        |
| ------------ | -------------------------------------------- |
| id           | Primary key                                  |
| tenant_id    | → Tenant                                      |
| role         | `ceo` \| `worker` \| `client`                |
| name, email  | Identity                                     |
| capabilities | Per-user grants/revokes over the role baseline |
| status       | active / invited / disabled                  |

### Client

The agency's customer. A Client may have one or more associated portal `User`
accounts (`role = client`).

| Field        | Notes                          |
| ------------ | ------------------------------ |
| id           | Primary key                    |
| tenant_id    | → Tenant                        |
| name         | Company / individual name      |
| contacts     | → User (client portal users)    |

### Lead (CRM)

A prospective client in the pipeline. Converts into a `Client`.

| Field        | Notes                                 |
| ------------ | ------------------------------------- |
| id           | Primary key                           |
| tenant_id    | → Tenant                               |
| stage        | Pipeline stage                        |
| owner_id     | → User (worker/CEO)                    |
| converted_to | → Client (nullable, set on conversion) |

### Project

A unit of client work. Central hub linking tasks, files, messages, contracts,
invoices, and calendar events.

| Field        | Notes                                |
| ------------ | ------------------------------------ |
| id           | Primary key                          |
| tenant_id    | → Tenant                              |
| client_id    | → Client                              |
| status       | e.g. active / on-hold / completed    |
| members      | → User (workers with access)         |

### Task

An assignable unit of work within a project.

| Field        | Notes                          |
| ------------ | ------------------------------ |
| id           | Primary key                    |
| tenant_id    | → Tenant                        |
| project_id   | → Project                       |
| assignee_id  | → User (worker)                 |
| status       | e.g. todo / doing / done       |
| due_at       | Deadline                       |

### CalendarEvent

A scheduled event, deadline, or meeting, optionally linked to a project/task.

| Field        | Notes                                    |
| ------------ | ---------------------------------------- |
| id           | Primary key                              |
| tenant_id    | → Tenant                                  |
| project_id   | → Project (nullable)                      |
| starts_at    |                                          |
| ends_at      |                                          |
| visibility   | internal / client-visible                |

### Conversation & Message (Messaging)

A conversation scoped to a project or an internal team; messages belong to a
conversation.

| Entity       | Key fields                                          |
| ------------ | --------------------------------------------------- |
| Conversation | id, tenant_id, project_id (nullable), scope (internal/client) |
| Message      | id, tenant_id, conversation_id, author_id, body, is_internal |

> `is_internal` messages and internal conversations are never visible to Clients.

### File

An uploaded document/deliverable, attachable to projects, tasks, or contracts,
with versioning and explicit sharing.

| Field        | Notes                                     |
| ------------ | ----------------------------------------- |
| id           | Primary key                               |
| tenant_id    | → Tenant                                   |
| project_id   | → Project (nullable)                       |
| storage_key  | Object storage reference                  |
| version      | Version number                            |
| shared_with  | Explicit share list (e.g. client access)  |

### Contract

An agreement tied to a client/project with status and signatures.

| Field        | Notes                                   |
| ------------ | --------------------------------------- |
| id           | Primary key                             |
| tenant_id    | → Tenant                                 |
| client_id    | → Client                                 |
| project_id   | → Project (nullable)                     |
| status       | draft / sent / signed / declined        |

### Invoice

A billing document tied to a client/project, with line items and payment state.

| Entity        | Key fields                                              |
| ------------- | ------------------------------------------------------- |
| Invoice       | id, tenant_id, client_id, project_id, status, total     |
| InvoiceLine   | id, invoice_id, description, quantity, unit_price        |
| Payment       | id, invoice_id, amount, provider_ref, paid_at            |

### MeetingNote

Notes from a meeting, with controllable client visibility.

| Field        | Notes                              |
| ------------ | ---------------------------------- |
| id           | Primary key                        |
| tenant_id    | → Tenant                            |
| project_id   | → Project (nullable)                |
| event_id     | → CalendarEvent (nullable)          |
| visibility   | internal / client-visible          |

### ActivityLog

Immutable audit record for every meaningful action.

| Field        | Notes                                       |
| ------------ | ------------------------------------------- |
| id           | Primary key                                 |
| tenant_id    | → Tenant                                     |
| actor_id     | → User                                       |
| action       | e.g. `task.updated`, `invoice.paid`          |
| resource     | Type + id of the affected entity            |
| created_at   | Timestamp                                   |

### Integration

A connection to an external provider (payments, accounting, communication).

| Field        | Notes                              |
| ------------ | ---------------------------------- |
| id           | Primary key                        |
| tenant_id    | → Tenant                            |
| provider     | e.g. stripe, quickbooks            |
| credentials  | Encrypted; never exposed to client |
| status       | connected / error / disconnected   |

## 3. Relationship Overview

```
Tenant 1───* User
Tenant 1───* Client
Client 1───* Project
Client 1───* Contract
Client 1───* Invoice
Lead   *───1 User (owner)      Lead 0..1───1 Client (converted_to)
Project 1───* Task
Project 1───* File
Project 1───* Conversation ───* Message
Project 0..*─* CalendarEvent
Project 1───* MeetingNote
Invoice 1───* InvoiceLine     Invoice 1───* Payment
* Any write ──▶ ActivityLog
```

## 4. Access Notes

- **Workers** see only projects they are members of (or as granted by
  capability overrides).
- **Clients** see only resources within their own `Client` record that are
  marked client-visible or explicitly shared — never internal messages/notes,
  never other clients' data, never staff information.
- All access resolves through the [Permission Matrix](permission-matrix.md) on
  top of tenant isolation.
</content>
