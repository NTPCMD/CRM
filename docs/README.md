# AgencyOS Documentation

This directory holds the canonical product and engineering documentation for
AgencyOS.

## Specification Volumes

| Volume | Document | Description |
| ------ | -------- | ----------- |
| **1** | [Product Requirements & System Architecture](product/prd-volume-1.md) | Vision, goals, personas, roles, modules, and success metrics. |
| **2** | [Database Architecture & Supabase Specification](architecture/database-architecture.md) | Authoritative physical data layer: Supabase/PostgreSQL 17, schema, RLS, functions, triggers, views. |
| **3** | [Frontend Architecture & UX Specification](architecture/frontend-architecture.md) | Authoritative frontend: Next.js/React stack, design system, CEO/Worker/Client portals, components. |
| 4 | *(planned)* | Backend API contracts, Edge Functions, Stripe, integrations, automation, event-driven architecture. |

## Architecture

| Document | Description |
| -------- | ----------- |
| [System Architecture](architecture/system-architecture.md) | High-level platform architecture, layers, and module map. |
| [Database Architecture (Vol. 2)](architecture/database-architecture.md) | **Authoritative** physical schema, RLS, functions, triggers, views. |
| [Frontend Architecture (Vol. 3)](architecture/frontend-architecture.md) | **Authoritative** frontend stack, design system, portals, and components. |
| [Data Model](architecture/data-model.md) | Conceptual entities and relationships (superseded by Vol. 2 for physical detail). |
| [Permission Matrix](architecture/permission-matrix.md) | Configurable capability-based authorization model. |
| [Technology Stack](architecture/tech-stack.md) | Ratified data + frontend stack; open payment/delivery decisions. |

## Reference

| Document | Description |
| -------- | ----------- |
| [Glossary](glossary.md) | Definitions of domain terms used across the docs. |

## Conventions

- Documents are the source of truth for scope. Code should trace back to a
  requirement here.
- Requirement IDs use the form `FR-<module>-<n>` (functional) and
  `NFR-<n>` (non-functional).
- Changes to product scope should update the PRD in the same pull request as
  the implementing code where practical.
</content>
