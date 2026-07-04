# AgencyOS — Technology Stack (Recommended)

These are **recommendations**, not ratified decisions. They exist to give
implementation work a concrete starting point consistent with the
[architecture](system-architecture.md). Each choice notes the requirement it
serves and viable alternatives.

## 1. Guiding Constraints

- Cloud-native, multi-tenant SaaS.
- Permission-first authorization enforced centrally (NFR-1).
- Real-time propagation to all portals (NFR-2).
- Immutable audit trail (NFR-3).
- Stateless, horizontally scalable services (NFR-4).

## 2. Recommended Stack

| Layer            | Recommendation                    | Why                                              | Alternatives                     |
| ---------------- | --------------------------------- | ------------------------------------------------ | -------------------------------- |
| Language/runtime | TypeScript on Node.js             | One language across API and web; strong typing.  | Go, Python                       |
| API style        | REST + typed contracts; WebSocket for realtime | Simple, cacheable; typed client generation. | GraphQL                          |
| Web frontend     | React (single codebase, three portal shells) | Mature ecosystem; shared components.  | SvelteKit, Vue                   |
| Data store       | PostgreSQL                        | Relational integrity for the unified data model; row-level security aids tenant isolation. | MySQL |
| Object storage   | S3-compatible storage             | Scalable file storage separate from the DB.      | GCS, Azure Blob                  |
| Cache            | Redis                             | Sessions, rate limiting, hot reads.              | Memcached                        |
| Realtime         | WebSocket service + Redis pub/sub | Fan-out of permission-filtered events.           | Managed realtime (Ably/Pusher)   |
| Event bus        | Redis streams / lightweight queue | Decouple audit, notifications, integrations.     | Kafka, NATS, SQS                 |
| Auth             | Token/session-based; per-tenant identity | Central authentication for all portals.   | Managed IdP (Auth0/Clerk)        |
| AI Assistant     | Latest Claude models via the Anthropic API | Capable, permission-bound assistant. | —                                |
| Payments         | Pluggable via Integrations module | Keeps billing provider swappable.                | Stripe (default)                 |

## 3. Tenancy Strategy

- **Shared database, shared schema, `tenant_id` on every row.**
- Enforce isolation at the data-access layer; PostgreSQL row-level security is
  recommended as defense-in-depth.
- Reconsider a per-tenant-schema or per-tenant-database model only if a customer
  contractually requires physical isolation (tracked as an open question).

## 4. Environments & Delivery

- Stateless services deployed as containers behind the API gateway.
- Separate `development`, `staging`, and `production` environments.
- Secrets managed outside source control and never exposed to client code or
  logs (NFR-5).

## 5. Repository Shape (proposed)

To be established when implementation begins; a monorepo is recommended so the
shared data model and permission definitions are used verbatim by every module
and portal:

```
/apps
  /api            API + module services
  /web-ceo        CEO portal
  /web-worker     Worker portal
  /web-client     Client portal
/packages
  /data-model     Entity definitions (shared)
  /permissions    Capability + matrix definitions (shared)
  /ui             Shared components
/docs             This documentation
```

## 6. Open Decisions

- Ratify language/framework choices.
- Choose managed vs. self-hosted for auth, realtime, and the event bus.
- Select the default payment/accounting integration providers.
- Decide monorepo tooling (workspaces, build orchestration).
</content>
