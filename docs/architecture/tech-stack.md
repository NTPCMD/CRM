# AgencyOS — Technology Stack

The **data layer is now ratified** by
[Volume 2: Database Architecture & Supabase Specification](database-architecture.md):
**Supabase on PostgreSQL 17**, with Supabase Auth, Realtime, Storage, and RLS.
The remaining rows below (application language, frontend, payments) are still
recommendations pending ratification. Each choice notes the requirement it
serves and viable alternatives.

## 1. Guiding Constraints

- Cloud-native, multi-workspace SaaS.
- Permission-first authorization enforced centrally (NFR-1).
- Real-time propagation to all portals (NFR-2).
- Immutable audit trail (NFR-3).
- Stateless, horizontally scalable services (NFR-4).

## 2. Stack

Legend: **Ratified** = fixed by Volume 2; **Recommended** = pending ratification.

| Layer            | Choice                            | Status      | Why / Alternatives                               |
| ---------------- | --------------------------------- | ----------- | ------------------------------------------------ |
| Backend platform | **Supabase**                      | Ratified    | Managed Postgres + Auth + Realtime + Storage + RLS + Edge Functions in one. |
| Data store       | **PostgreSQL 17**                 | Ratified    | Relational integrity + RLS for workspace isolation; pgvector for AI. |
| Auth             | **Supabase Auth** (`auth.users` + `profiles`) | Ratified | Central identity for all portals.        |
| Realtime         | **Supabase Realtime**             | Ratified    | RLS-filtered change broadcasts to subscribers.   |
| Object storage   | **Supabase Storage** (signed URLs)| Ratified    | Buckets governed by storage policies mirroring RLS. |
| Server logic     | **Postgres functions + Supabase Edge Functions** | Ratified | Consistent business logic close to the data. |
| Language/runtime | TypeScript on Node.js             | Recommended | One language across app and web. Alt: Go, Python. |
| Web frontend     | React (three portal shells)       | Recommended | Shared components. Alt: SvelteKit, Vue.          |
| AI Assistant     | Latest Claude models via the Anthropic API | Recommended | Permission-bound assistant.             |
| Payments         | Pluggable via Integrations module | Recommended | Keeps provider swappable. Default: Stripe.        |

## 3. Tenancy Strategy

- **Workspace-first: shared database, shared schema, `workspace_id` on every
  business row** (Volume 2, §1).
- Isolation is enforced by **PostgreSQL Row Level Security** with a deny-by-default
  posture (Volume 2, §25), not left to application code alone.
- Reconsider a per-workspace-schema or per-workspace-database model only if a
  customer contractually requires physical isolation (tracked as an open
  question).

## 4. Environments & Delivery

- Stateless services deployed as containers behind the API gateway.
- Separate `development`, `staging`, and `production` environments.
- Secrets managed outside source control and never exposed to client code or
  logs (NFR-5).

## 5. Repository Shape (proposed)

To be established when implementation begins; a monorepo is recommended so the
schema, generated types, and permission definitions are used verbatim by every
module and portal:

```
/supabase
  /migrations     SQL schema, RLS policies, functions, triggers, views
  /functions      Edge Functions
/apps
  /web-ceo        CEO portal
  /web-worker     Worker portal
  /web-client     Client portal
/packages
  /db-types       Types generated from the Supabase schema (shared)
  /permissions    Capability definitions + middleware (shared)
  /ui             Shared components
/docs             This documentation
```

## 6. Open Decisions

- Ratify application language/framework choices (data layer is settled).
- Select the default payment/accounting integration providers.
- Decide monorepo tooling (workspaces, build orchestration).
- Confirm self-hosted vs. Supabase-hosted deployment target.
</content>
