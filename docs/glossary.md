# AgencyOS — Glossary

| Term                 | Definition                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| **AgencyOS**         | The operating-system-for-agencies SaaS platform described in these docs.   |
| **Workspace**        | The canonical top-level isolation boundary (Vol. 2); one customer and all its data. Every business row carries `workspace_id`. |
| **Tenant / Agency**  | Volume 1 term for the isolation boundary; equivalent to **Workspace**.      |
| **Profile**          | The application user record (1:1 with Supabase `auth.users`) holding identity and preferences. |
| **Soft delete**      | Marking a row deleted via `deleted_at` instead of removing it; business data is never hard-deleted. |
| **RLS**              | PostgreSQL Row Level Security; enforces deny-by-default, workspace-scoped access. |
| **Supabase**         | The ratified backend platform (PostgreSQL 17, Auth, Realtime, Storage, RLS, Edge Functions). |
| **CEO Portal**       | Administrative experience with full control over the business.             |
| **Worker Portal**    | Operational experience for employees and contractors.                      |
| **Client Portal**    | Restricted experience where a client monitors and communicates.            |
| **Role**             | A baseline capability set: `ceo`, `worker`, or `client`.                   |
| **Capability**       | A named permission (`<module>.<action>`) that gates a specific action.     |
| **Permission Matrix**| The capability-based authorization model; role baseline plus per-user overrides. |
| **Capability override** | A per-user grant or revoke applied on top of the role baseline.         |
| **Resource-level sharing** | Explicit access to a specific resource (e.g. a client granted a project). |
| **Lead**             | A prospective client in the CRM pipeline; may convert into a Client.       |
| **Client**           | An agency customer; may have one or more client-portal users.              |
| **Project**          | A unit of client work linking tasks, files, messages, contracts, invoices. |
| **Task**             | An assignable, trackable unit of work within a project.                    |
| **Internal**         | Data marked staff-only and never visible to clients (e.g. internal notes). |
| **Activity Log**     | Immutable, attributable audit trail of meaningful actions.                 |
| **Realtime Engine**  | Service that pushes permission-filtered state changes to connected clients.|
| **AI Assistant**     | Cross-module assistant, bound by the acting user's permissions.            |
| **Integration**      | A connection to an external provider (payments, accounting, communication).|
| **Design System**    | The shared tokens (color, type, spacing) and shadcn/ui component library used by every screen (Vol. 3). |
| **Command Palette**  | The ⌘K / Ctrl+K universal search-and-action surface. |
| **Role-gated**       | UI (sidebar, screens) filtered by the user's role and effective permissions. |
| **Server state / UI state** | Data from Supabase (owned by TanStack Query) vs. ephemeral interface state (owned by Zustand). |
| **AI Gateway**       | Provider-agnostic layer that routes AI requests (default Claude) and handles prompts, context, token accounting, and rate limiting (Vol. 4). |
| **Event / Event catalogue** | A named domain event (e.g. `invoice.paid`) emitted on state change; subscribers react without tight coupling (Vol. 4). |
| **Edge Function**    | A small, independently deployable Supabase serverless function (Vol. 4 §7). |
| **Automation**       | A no-code `Trigger → Conditions → Actions` workflow built on the event catalogue (Vol. 4 §16). |
| **Adapter**          | The isolation boundary around an external integration (`Connect → Sync → …`) (Vol. 4 §17). |
| **Modular monolith** | The MVP deployment shape: services as modules in one deployable, extractable later (Vol. 4 §23). |
| **Idempotency**      | Guarantee that a repeated webhook/request has no additional effect; required for all webhooks (Vol. 4 §18). |
| **AI Agent**         | A specialized, permission-bound assistant (Project Manager, Finance, CRM, Operations, Meeting) built on the AI Gateway (Vol. 5 §3). |
| **RPO / RTO**        | Recovery Point Objective (≤15 min of data loss) / Recovery Time Objective (≤1 hr to restore) (Vol. 5 §12). |
| **MFA**              | Multi-factor authentication, part of the Supabase Auth security posture (Vol. 5 §8). |
| **Modular monolith → microservices** | The staged scaling path: single deployable MVP → extracted services at enterprise scale (Vol. 4 §23 / Vol. 5 §13). |
</content>
