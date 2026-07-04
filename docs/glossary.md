# AgencyOS — Glossary

| Term                 | Definition                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| **AgencyOS**         | The operating-system-for-agencies SaaS platform described in these docs.   |
| **Tenant / Agency**  | The top-level isolation boundary; one customer agency and all its data.    |
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
</content>
