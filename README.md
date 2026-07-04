# AgencyOS

> The operating system for modern agencies.

AgencyOS is a cloud-native SaaS platform that centralizes the operations of
digital agencies, freelancers, consultancies, and service businesses into a
single workspace — replacing the fragmented mix of CRM, project management,
messaging, invoicing, calendars, contracts, and file sharing tools most
agencies stitch together today.

The platform is organized around three permission-controlled experiences:

| Portal            | Audience                     | Purpose                                                        |
| ----------------- | ---------------------------- | -------------------------------------------------------------- |
| **CEO Portal**    | Owners / administrators      | Full administrative control over the business.                 |
| **Worker Portal** | Employees / contractors      | Operational workspace for delivering client work.              |
| **Client Portal** | Clients                      | Secure environment to monitor projects and communicate.        |

Every action is permission-controlled, audited, and available in real time.

## Documentation

This repository currently holds the product and architecture specification for
AgencyOS. Start with the documentation index:

- **[docs/README.md](docs/README.md)** — documentation index
- [Volume 1 — Product Requirements & System Architecture](docs/product/prd-volume-1.md)
- [Volume 2 — Database Architecture & Supabase Specification](docs/architecture/database-architecture.md)
- [Volume 3 — Frontend Architecture & UX Specification](docs/architecture/frontend-architecture.md)
- [Volume 4 — Backend Architecture, APIs & Integrations](docs/architecture/backend-architecture.md)
- [Volume 5 — AI, Production, DevOps & Enterprise Operations](docs/architecture/production-operations.md)
- [System Architecture](docs/architecture/system-architecture.md)
- [Data Model (conceptual)](docs/architecture/data-model.md)
- [Permission Matrix](docs/architecture/permission-matrix.md)
- [Technology Stack](docs/architecture/tech-stack.md)
- [Glossary](docs/glossary.md)

## Status

Pre-development. The complete **five-volume blueprint** (product, database,
frontend, backend, and production/operations) is captured under
[`docs/`](docs/README.md) and the full technology stack is ratified in the
[decision ledger](docs/architecture/tech-stack.md). Implementation has not yet
begun; the natural first slice is the Supabase schema (workspaces, profiles,
roles/permissions, and RLS) from Volume 2.
</content>
</invoke>
