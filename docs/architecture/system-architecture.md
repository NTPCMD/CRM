# AgencyOS — System Architecture

This document translates the [PRD](../product/prd-volume-1.md) into a technical
architecture. It describes the platform layers, the module map, the request
lifecycle, and the cross-cutting concerns (authorization, realtime, audit) that
every module inherits.

> **This is the Volume 1 conceptual architecture.** The concrete realizations
> now live in later volumes: the physical data layer in
> [Volume 2](database-architecture.md), the frontend in
> [Volume 3](frontend-architecture.md), and the API / service / event-bus layer
> in [Volume 4](backend-architecture.md). Where they differ, the later volume is
> authoritative — notably, Volume 4 formalizes the "API gateway" and "event bus"
> referenced below as a REST API layer plus an event catalogue, deployed as a
> **modular monolith first**.

## 1. Architectural Goals

| Goal            | Implication                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Unified data    | A single, shared data model — no per-tool data silos.                   |
| Permission-first| Authorization is enforced centrally, not per-module ad hoc.             |
| Real-time       | State changes propagate to all portals with low latency.               |
| Auditable       | Every meaningful write produces an immutable activity log entry.        |
| Multi-tenant    | Agencies are isolated tenants sharing one logical platform.            |
| Scalable        | Horizontally scalable stateless services behind a shared data layer.   |

## 2. Layered View

```
┌───────────────────────────────────────────────────────────────┐
│  Client Applications                                          │
│  CEO Portal   ·   Worker Portal   ·   Client Portal          │
└───────────────────────────────┬───────────────────────────────┘
                                │  HTTPS / WebSocket
┌───────────────────────────────▼───────────────────────────────┐
│  API Gateway / Edge                                            │
│  TLS termination · rate limiting · request routing            │
└───────────────────────────────┬───────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────┐
│  Cross-Cutting Platform Services                               │
│  Authentication → Authorization (Permission Matrix)           │
│  Realtime Engine → Notifications                              │
│  Activity Log / Audit · AI Assistant · Reporting             │
└───────────────────────────────┬───────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────┐
│  Domain Modules                                                │
│  CRM · Projects · Tasks · Calendar · Messaging · Files        │
│  Contracts · Invoices · Meeting Notes · Integrations          │
└───────────────────────────────┬───────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────┐
│  Shared Data Layer                                             │
│  Relational store (tenants, entities, permissions)            │
│  Object storage (files) · Cache · Event bus                   │
└───────────────────────────────────────────────────────────────┘
```

## 3. Cross-Cutting Services

These services are not modules; every module depends on them.

### 3.1 Authentication

- Establishes user identity and issues a session/token.
- Supports the three portal audiences (CEO, Worker, Client) with a single
  identity per user, scoped to a tenant.
- Clients are first-class users with narrowly scoped access, never shared logins.

### 3.2 Authorization (Permission Matrix)

- Every request is checked against a **capability-based permission matrix**
  before reaching a module. See [Permission Matrix](permission-matrix.md).
- Authorization is centralized so modules never re-implement access rules.
- Resolution order: **tenant isolation → role baseline → per-user capability
  overrides → resource-level sharing (e.g., a client granted a project).**

### 3.3 Realtime Engine

- Pushes state changes to connected clients over WebSocket so all portals stay
  in sync without polling.
- Subscriptions are permission-filtered: a subscriber only receives events for
  resources they are authorized to see.

### 3.4 Notifications

- Derives user-facing notifications from domain events (task assigned, invoice
  paid, message received, contract signed).
- Delivered in-app via the realtime engine and, optionally, via integrations
  (email, etc.).

### 3.5 Activity Log / Audit

- Every meaningful write emits an immutable, attributable log entry
  (actor, action, resource, tenant, timestamp).
- Serves both compliance/audit and the activity feeds shown in each portal.

### 3.6 AI Assistant

- Cross-module service that automates repetitive work (drafting messages,
  summarizing meeting notes, suggesting next actions) and surfaces insights.
- Operates under the same permission matrix as human users — it can never read
  or act on data the requesting user cannot.

### 3.7 Reporting

- Aggregates operational and financial data into executive dashboards with live
  metrics (project progress, workload, profitability).

## 4. Module Map

| Module        | Owns                                   | Key relationships                              |
| ------------- | -------------------------------------- | ---------------------------------------------- |
| CRM           | Leads, pipeline stages, conversion     | Lead → Client on conversion                    |
| Projects      | Projects, membership, status           | Belongs to Client; has Tasks, Files, Messages  |
| Tasks         | Tasks, assignments, status             | Belongs to Project; assigned to Worker         |
| Calendar      | Events, deadlines, meetings            | Linked to Projects and Tasks                   |
| Messaging     | Conversations, messages                | Scoped to Project or internal team             |
| Files         | Documents, versions, sharing           | Attached to Projects, Tasks, Contracts         |
| Contracts     | Agreements, status, signatures         | Belongs to Client / Project                    |
| Invoices      | Invoices, line items, payments         | Belongs to Client / Project                    |
| Meeting Notes | Notes, attendees, visibility           | Linked to Calendar events and Projects         |
| Integrations  | External provider connections          | Feeds Invoices (payments), Notifications        |

## 5. Request Lifecycle

1. Client app sends an authenticated request through the API gateway.
2. **Authentication** resolves the user and tenant.
3. **Authorization** evaluates the required capability against the permission
   matrix and resource-level sharing; unauthorized requests are rejected before
   any module executes.
4. The target **module** performs the operation against the shared data layer.
5. A domain event is emitted to the **event bus**.
6. The **activity log** persists an audit entry; the **realtime engine** fans
   the event out to permission-filtered subscribers; **notifications** are
   generated as applicable.

## 6. Multi-Tenancy & Isolation

- Every persisted entity carries a `tenant_id`; all queries are tenant-scoped.
- Cross-tenant access is impossible by construction, enforced at the data-access
  layer, not left to individual modules.
- Client users are additionally constrained to only the resources explicitly
  shared with them within their tenant.

## 7. Non-Functional Requirements

| ID     | Requirement                                                              |
| ------ | ------------------------------------------------------------------------ |
| NFR-1  | All data access is tenant-isolated and permission-checked.               |
| NFR-2  | State changes propagate to authorized clients in near real time.         |
| NFR-3  | Every write is auditable and attributable.                               |
| NFR-4  | Services are stateless and horizontally scalable.                        |
| NFR-5  | Secrets and credentials are never exposed to client-side code or logs.   |
| NFR-6  | The AI Assistant is bound by the same authorization as the acting user.  |

## 8. Open Questions

Most Volume 1 open questions are now resolved by later volumes:

- ~~Concrete technology choices~~ — **ratified** across Volumes 2–5; see the
  [decision ledger](tech-stack.md).
- ~~Data residency / per-region deployment~~ — addressed by
  [multi-region scaling (Vol. 5, Phase 3)](production-operations.md#13-scaling-strategy).

Still open:

- Billing/subscription model for AgencyOS itself (platform monetization).
- Offline/degraded-connectivity behavior for the portals.
</content>
