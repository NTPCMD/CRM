# AgencyOS — Permission Matrix

AgencyOS authorization is **capability-based**. Roles provide a baseline set of
capabilities; administrators grant or revoke individual capabilities per user
**without creating new roles**. This keeps access flexible while auditable.

## 1. Model

```
Effective access =
      tenant isolation                      (hard boundary)
  AND role baseline capabilities            (default per role)
  ⊕   per-user capability overrides         (grant / revoke)
  AND resource-level sharing                (e.g. client granted a project)
```

- **Tenant isolation** is absolute and cannot be overridden by any capability.
- **Role baseline** defines sensible defaults for CEO, Worker, and Client.
- **Overrides** let an admin, for example, grant one worker access to financials
  without promoting them.
- **Resource-level sharing** governs which specific projects/files/etc. a Client
  or Worker can reach.

## 2. Capabilities

Capabilities are named `<module>.<action>`. Actions are typically
`view`, `create`, `update`, `delete`, plus module-specific ones.

| Capability                | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `settings.manage`         | Modify company/tenant settings.                |
| `users.manage`            | Create, disable, and edit users.               |
| `permissions.manage`      | Grant/revoke capabilities to users.            |
| `crm.view` / `crm.manage` | View / manage leads and pipeline.              |
| `projects.view`           | View projects (subject to membership/sharing). |
| `projects.manage`         | Create/update/delete projects.                 |
| `tasks.view` / `tasks.manage` | View / manage tasks.                       |
| `calendar.view` / `calendar.manage` | View / manage calendar events.      |
| `messaging.internal`      | Read/write internal conversations.             |
| `messaging.client`        | Communicate with clients.                      |
| `files.view` / `files.manage` | View / upload / share files.               |
| `contracts.view` / `contracts.manage` | View / manage contracts.          |
| `invoices.view` / `invoices.manage` | View / manage invoices & payments.  |
| `finance.view`            | Access restricted financial information.       |
| `meetingnotes.view` / `meetingnotes.manage` | View / manage meeting notes. |
| `reports.view`            | Access executive dashboards & reports.         |
| `integrations.manage`     | Connect/manage external integrations.          |
| `activity.view`           | View audit/activity logs.                      |

## 3. Role Baselines

Legend: ✔ granted · �– conditional (subject to membership/sharing or "when
permitted") · ✘ denied.

| Capability              | CEO | Worker | Client |
| ----------------------- | :-: | :----: | :----: |
| `settings.manage`       |  ✔  |   ✘    |   ✘    |
| `users.manage`          |  ✔  |   ✘    |   ✘    |
| `permissions.manage`    |  ✔  |   ✘    |   ✘    |
| `crm.view`              |  ✔  |   ✔    |   ✘    |
| `crm.manage`            |  ✔  |   ✔    |   ✘    |
| `projects.view`         |  ✔  |   ✔–   |   ✔–   |
| `projects.manage`       |  ✔  |   ✔–   |   ✘    |
| `tasks.view`            |  ✔  |   ✔–   |   ✘    |
| `tasks.manage`          |  ✔  |   ✔–   |   ✘    |
| `calendar.view`         |  ✔  |   ✔–   |   ✔–   |
| `calendar.manage`       |  ✔  |   ✔–   |   ✘    |
| `messaging.internal`    |  ✔  |   ✔    |   ✘    |
| `messaging.client`      |  ✔  |   ✔–   |   ✔–   |
| `files.view`            |  ✔  |   ✔–   |   ✔–   |
| `files.manage`          |  ✔  |   ✔–   |   ✘    |
| `contracts.view`        |  ✔  |   ✔–   |   ✔–   |
| `contracts.manage`      |  ✔  |   ✔–   |   ✘    |
| `invoices.view`         |  ✔  |   ✔–   |   ✔–   |
| `invoices.manage`       |  ✔  |   ✘    |   ✘    |
| `finance.view`          |  ✔  |   ✘    |   ✘    |
| `meetingnotes.view`     |  ✔  |   ✔–   |   ✔–   |
| `meetingnotes.manage`   |  ✔  |   ✔–   |   ✘    |
| `reports.view`          |  ✔  |   ✘    |   ✘    |
| `integrations.manage`   |  ✔  |   ✘    |   ✘    |
| `activity.view`         |  ✔  |   ✘    |   ✘    |

Notes:

- **Worker ✔–** entries depend on **project membership**: a worker acts within
  the projects they belong to and cannot view unrelated projects. Capability
  overrides can widen or narrow this.
- **Client ✔–** entries depend on **explicit sharing**: a client sees only
  resources within their own `Client` record that are marked client-visible.
- **Clients never** see internal comments (`is_internal` messages / internal
  conversations), other clients' data, staff information, or business settings —
  regardless of overrides.

## 4. Enforcement Rules

1. Authorization is evaluated centrally before any module executes (see
   [System Architecture §3.2](system-architecture.md#32-authorization-permission-matrix)).
2. Tenant isolation and the client "never" list are **hard constraints** that no
   override can bypass.
3. The [AI Assistant](system-architecture.md#36-ai-assistant) executes under the
   acting user's effective capabilities — it can never access data the user
   could not.
4. Realtime subscriptions are filtered by the same effective capabilities, so a
   user is never pushed an event for a resource they cannot access.
5. Every grant/revoke of a capability is written to the
   [ActivityLog](data-model.md#activitylog).
</content>
