# AgencyOS — Volume 4: Backend Architecture, APIs & Integrations

**Version:** 1.0

This volume is the **authoritative specification for the backend**: service
layout, API contracts, the event-driven model, Edge Functions, the AI Gateway,
and the integration/webhook framework. It builds on the ratified data layer
([Volume 2](database-architecture.md)) and frontend
([Volume 3](frontend-architecture.md)).

> **Two decisions here refine earlier volumes:** the AI layer is a
> **provider-agnostic gateway** (not a single hard-coded provider), and the
> deployment target is a **modular monolith first**, with a documented path to
> microservices — not microservices from day one.

---

## 1. Backend Philosophy

AgencyOS is a **modular service platform**, not one large application. Each
business capability owns its domain.

```
Frontend → API Layer → Business Services → Database → Realtime → Integrations
```

**The frontend never contains business logic.** Validation, permissions,
calculations, and workflows live in backend services or database functions.

## 2. Service Architecture

```
Gateway
├── Auth Service          ├── File Service
├── User Service          ├── Contract Service
├── CRM Service           ├── Invoice Service
├── Project Service       ├── AI Gateway
├── Task Service          ├── Notification Service
├── Calendar Service      ├── Automation Service
├── Messaging Service     └── Analytics Service
```

Each service owns its business rules and communicates through **events** where
appropriate. Physically these begin as modules within one deployable (see
[§23 Scalability Roadmap](#23-scalability-roadmap)).

## 3. API Standards

- **Resource-oriented REST**: `/api/projects`, `/api/tasks`, `/api/clients`,
  `/api/messages`, `/api/invoices`, `/api/contracts`.
- **HTTP verbs**: `GET`, `POST`, `PATCH`, `DELETE`. No RPC-style endpoints unless
  strictly necessary.
- **APIs are versioned and documented.**

Success envelope:

```json
{ "success": true, "data": {}, "meta": {} }
```

Error envelope:

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

## 4. Authentication Flow

```
User → Supabase Auth → JWT → API → Permission Middleware → Business Service → Database
```

**JWTs carry minimal claims** — no excessive business data. Permissions are
resolved from the database when needed (cacheable, see [§22](#22-caching)).

## 5. Authorization

Every request passes, in order:

```
Workspace Check → Role Check → Permission Check → Ownership Check → Business Rules
```

Ownership matters independently of capability: a worker with `projects.edit`
**still cannot edit a project they are not assigned to.** This is the runtime
enforcement of the [permission model](database-architecture.md#10-roles--permission-model)
layered on top of RLS.

## 6. Event-Driven Architecture

Every meaningful action emits an event; multiple subscribers react without tight
coupling.

```
task.created → { Notification · Activity Log · Analytics · AI Summary }
```

### Event Catalogue (examples)

```
workspace.created   user.invited      user.joined
project.created     project.archived
task.created        task.completed
invoice.sent        invoice.paid
contract.signed     meeting.finished
message.sent        file.uploaded
```

These events power [automations](#17-automation-engine) and
[integrations](#18-integration-framework).

## 7. Edge Functions

Small, focused, independently deployable Supabase Edge Functions:

```
create-workspace   invite-user         create-project
duplicate-project  archive-project     send-invoice
generate-pdf       summarize-meeting   generate-ai-response
search-workspace   upload-complete     stripe-webhook
calendar-sync      github-webhook
```

## 8. AI Gateway

The application never hard-codes a single model provider. It calls the **AI
Gateway**, which routes to the appropriate backend:

```
Application → AI Gateway → { Anthropic · OpenAI · Google · Local Models }
```

The gateway provides: prompt templates, context retrieval, token accounting,
rate limiting, and model routing. **Default provider: latest Claude models**;
others are pluggable without application changes.

### AI Context

The assistant builds context from: current page, current project, workspace,
**user permissions**, recent activity, and related documents. A client asking
"What's next?" receives a different answer than a CEO asking the same — the
gateway resolves context under the caller's permissions and never exposes data
the user cannot see.

## 9. File Processing

```
Browser → Signed Upload URL → Supabase Storage → Virus Scan (future)
        → Metadata Extraction → Thumbnail Generation → Database Record
        → Realtime Update
```

Large uploads use **resumable uploads**. URLs are always signed
([Vol. 2 §23](database-architecture.md#23-storage-architecture)).

## 10. Notification Service

Types: task assigned, task due, mention, message, meeting reminder, invoice
paid, contract signed, AI completed. Channels: **In-app**, **Email**, Push
(future), SMS (future). Users set their own preferences (stored on `profiles`).

## 11. Calendar Service

Supports meetings, project deadlines, personal events, recurring events, and
availability. Future: Google Calendar, Outlook, Cal.com, Calendly (via the
[integration framework](#18-integration-framework)).

## 12. Messaging Service

```
Conversation → Participants → Messages → Attachments → Reactions
            → Read Receipts → Typing Presence
```

Realtime subscriptions keep conversations in sync across devices.

## 13. Invoice Service

State machine: `Draft → Review → Sent → Viewed → Paid → Archived`.

Capabilities: PDF generation, tax calculation, discount handling, payment
reminders, payment history. Future: partial payments, subscriptions, quotes.
Totals are always **calculated**, never stored as source of truth
([Vol. 2 §16](database-architecture.md#16-invoices-finance)).

## 14. Contract Service

State machine: `Draft → Review → Sent → Viewed → Signed → Archived`.

Future: multiple signers, templates, version history, expiration reminders.

## 15. Search Service

PostgreSQL Full-Text Search over Projects, Tasks, Clients, Messages, Contracts,
and Meeting Notes. Later, **semantic search** via vector embeddings
(`ai_embeddings` / pgvector) enables natural-language queries like *"Show me
every discussion about the homepage redesign."* All results are
permission-filtered.

## 16. Automation Engine

```
Trigger → Conditions → Actions
```

Example: `invoice.paid` → if amount > $5000 → notify CEO → draft thank-you
email → update dashboard. Users build workflows **without writing code**;
triggers are drawn from the [event catalogue](#6-event-driven-architecture).

## 17. Integration Framework

Every external integration follows one lifecycle, isolated behind an **adapter**:

```
Connect → Authenticate → Sync → Process Events → Handle Errors → Retry
```

### Initial Integrations

| Category      | Providers                                   |
| ------------- | ------------------------------------------- |
| Productivity  | Google Workspace, Microsoft 365, Slack, Discord |
| Development    | GitHub, GitLab, Bitbucket                   |
| Finance       | **Stripe**, Xero, MYOB, QuickBooks          |
| Storage       | Google Drive, Dropbox, OneDrive             |
| Design        | Figma, Canva                                |
| Automation    | Zapier, Make, n8n                           |
| AI            | Anthropic, OpenAI, Gemini                   |

## 18. Webhooks

- **Inbound:** Stripe, GitHub, Google Calendar, Figma.
- **Outbound:** `project.created`, `invoice.paid`, `contract.signed`,
  `task.completed`, `client.created`.
- Every webhook uses **signature verification and idempotency protection**.

## 19. Error Handling

Standardized categories: Validation, Authentication, Authorization, Business
Rule, Rate Limit, External Service, Unexpected. Every error carries a **developer
code** and a **user-friendly message** (mirrors the API error envelope, §3).

## 20. Monitoring

Collect: API latency, error rates, database performance, queue depth, AI usage,
storage consumption, realtime connections. Dashboards support proactive alerting.

## 21. Logging

Structured logs per service: timestamp, **workspace_id**, user_id (if any),
request_id, service, action, duration, result. **Secrets — tokens, passwords,
payment details — are never logged** (NFR-5).

## 22. Caching

Cache read-heavy data: permission lookups, workspace settings, user profiles,
frequently accessed dashboards. **Invalidate on underlying change** to avoid
stale reads.

## 23. Scalability Roadmap

Design so services can be extracted over time:

1. **Stage 1 — Modular monolith** (recommended MVP).
2. **Stage 2 —** Separate AI and automation services.
3. **Stage 3 —** Independent messaging and notification services.
4. **Stage 4 —** Distributed, event-driven architecture for enterprise scale.

Starting as a modular monolith keeps development simple while preserving a clean
path to microservices.

## 24. Developer Principles

- One responsibility per service.
- Permission checks **before** business logic.
- Emit events for significant state changes.
- Prefer composition over duplication.
- Keep APIs versioned and documented.
- Write tests alongside features.
- Treat integrations as replaceable modules.

## 25. Reconciliation with Prior Volumes

| Prior volume | Volume 4 refines |
| ------------ | ---------------- |
| Vol. 1: "stateless, horizontally scalable services" | **Modular monolith first**, microservices as a staged roadmap (§23). |
| Vol. 1: generic "event bus" | Formal **event catalogue** + event-driven subscribers (§6). |
| Vol. 2/3: "Claude via Anthropic API" | **Provider-agnostic AI Gateway**, default Claude (§8). |
| Vol. 1/2: Edge Functions mentioned | Concrete Edge Function catalogue (§7). |
| Recommended payments | **Stripe confirmed** as the initial payment integration (§17). |
| Vol. 2 RLS | Runtime **authorization pipeline** layered on RLS (§5). |

## 26. Looking Ahead to Volume 5

The final volume covers AI agents and autonomous workflows, production
infrastructure, Docker and deployment, CI/CD, testing strategy, security
hardening, disaster recovery, observability, performance optimization, the
enterprise roadmap, launch checklist, and the future feature roadmap.
</content>
