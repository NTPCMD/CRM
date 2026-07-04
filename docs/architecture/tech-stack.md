# AgencyOS — Technology Stack

The **data layer** is ratified by
[Volume 2: Database Architecture & Supabase Specification](database-architecture.md)
(**Supabase on PostgreSQL 17**), and the **frontend** by
[Volume 3: Frontend Architecture & UX](frontend-architecture.md)
(**Next.js 15 / React 19 / TypeScript**). Only the payment provider and a few
delivery details remain open. Each choice notes the requirement it serves and
viable alternatives.

## 1. Guiding Constraints

- Cloud-native, multi-workspace SaaS.
- Permission-first authorization enforced centrally (NFR-1).
- Real-time propagation to all portals (NFR-2).
- Immutable audit trail (NFR-3).
- Stateless, horizontally scalable services (NFR-4).

## 2. Stack

Legend: **Ratified** = fixed by a specification volume; **Recommended** =
pending ratification. Volume that fixed each choice is noted.

| Layer            | Choice                            | Status         | Why / Alternatives                               |
| ---------------- | --------------------------------- | -------------- | ------------------------------------------------ |
| Backend platform | **Supabase**                      | Ratified (V2)  | Managed Postgres + Auth + Realtime + Storage + RLS + Edge Functions in one. |
| Data store       | **PostgreSQL 17**                 | Ratified (V2)  | Relational integrity + RLS for workspace isolation; pgvector for AI. |
| Auth             | **Supabase Auth** (`auth.users` + `profiles`) | Ratified (V2) | Central identity for all portals.     |
| Realtime         | **Supabase Realtime**             | Ratified (V2)  | RLS-filtered change broadcasts to subscribers.   |
| Object storage   | **Supabase Storage** (signed URLs)| Ratified (V2)  | Buckets governed by storage policies mirroring RLS. |
| Server logic     | **Postgres functions + Supabase Edge Functions** | Ratified (V2) | Consistent business logic close to the data. |
| Framework        | **Next.js 15 (App Router) / React 19 / TypeScript** | Ratified (V3) | One role-gated app for all portals. |
| Styling / UI     | **Tailwind CSS + shadcn/ui** (CSS-variable theming) | Ratified (V3) | Consistent component library across modules. |
| Client state     | **Zustand** (UI) + **TanStack Query** (server) | Ratified (V3) | Clean split of ephemeral vs. server state. |
| Forms            | **React Hook Form + Zod**         | Ratified (V3)  | Shared validation schemas; autosave/draft support. |
| Animation        | **Framer Motion**                 | Ratified (V3)  | Honors reduced-motion for accessibility.         |
| AI Assistant     | Latest Claude models via the Anthropic API | Recommended | Permission-bound assistant.             |
| Payments         | Pluggable via Integrations module | Recommended    | Keeps provider swappable. Default: Stripe.        |

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
schema, generated types, and permission definitions are used verbatim by the app
and functions. Per Volume 3, the three portals are **one role-gated Next.js
app**, not separate apps:

```
/supabase
  /migrations     SQL schema, RLS policies, functions, triggers, views
  /functions      Edge Functions
/apps
  /web            Next.js 15 app — CEO / Worker / Client portals, role-gated
/packages
  /db-types       Types generated from the Supabase schema (shared)
  /permissions    Capability definitions + middleware (shared)
  /ui             Shared shadcn/ui components (shared)
/docs             This documentation
```

## 6. Open Decisions

- Select the default payment/accounting integration providers (V4 scope).
- Decide monorepo tooling (workspaces, build orchestration).
- Confirm self-hosted vs. Supabase-hosted deployment target.
</content>
