# AgencyOS — Volume 5: AI, Production, DevOps & Enterprise Operations

**Version:** 1.0

This volume is the **authoritative specification for production operations**: the
AI agent layer, infrastructure, CI/CD, security, compliance, observability,
disaster recovery, testing, deployment, the launch checklist, and the product
roadmap. It closes the five-volume blueprint (see [§20](#20-complete-documentation-set)).

> Volume 5 resolves the deployment/CI/monitoring items that Volumes 1–4 left
> open, adds **specialized AI agents** on top of Volume 4's
> [AI Gateway](backend-architecture.md#8-ai-gateway), and confirms the staged
> scaling roadmap.

---

## 1. Production Philosophy

AgencyOS must grow from a single freelancer to an enterprise with thousands of
users **without a rewrite**. Guiding principles:

- Secure by default
- Modular architecture
- Event-driven workflows
- **AI-assisted, not AI-dependent**
- Horizontal scalability
- Observable and measurable

## 2. AI Architecture

The AI layer is an **application service, not the application itself**. Every
request flows through a permission filter before any model sees data.

```
User
 └─▶ Context Builder
      └─▶ Permission Filter        ← only data the user may access
           └─▶ Knowledge Retrieval
                └─▶ AI Gateway
                     └─▶ { Anthropic · OpenAI · Gemini · Local Models }
```

This is the runtime realization of Volume 4's gateway: every AI request includes
**only the data the current user is authorized to access**.

## 3. AI Agents

Rather than a single chatbot, AgencyOS provides **specialized agents**, each
bound by the requesting user's permissions:

| Agent               | Responsibilities                                                         |
| ------------------- | ------------------------------------------------------------------------ |
| **Project Manager** | Detect overdue projects, suggest milestones, generate subtasks, summarize progress, recommend timelines. |
| **Finance**         | Track unpaid invoices, forecast revenue, identify late payments, generate monthly summaries, flag unusual activity. |
| **CRM**             | Summarize client history, draft follow-up emails, score leads, recommend next actions. |
| **Operations**      | Monitor workloads, detect bottlenecks, suggest staffing adjustments, surface operational risks. |
| **Meeting**         | Transcribe recordings, summarize meetings, extract action items, assign follow-up tasks. |

Agents act through the same services and events as human users — they cannot
read or write anything the acting user could not.

## 4. Automation Engine

Event-condition-action, extending Volume 4's
[automation engine](backend-architecture.md#16-automation-engine):

```
Trigger → Condition → Actions
```

Example: `project.completed` → generate invoice → notify client → archive project
→ create testimonial request. Actions may call internal modules or external
integrations.

## 5. Infrastructure (Recommended Production Stack)

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Frontend  | Next.js on **Vercel** (or self-hosted)                    |
| Backend   | **Supabase** + Edge Functions                             |
| Storage   | Supabase Storage (+ S3-compatible for future portability) |
| CDN       | **Cloudflare**                                            |
| Email     | **Resend** or **Postmark**                                |
| Payments  | **Stripe**                                                |

## 6. CI/CD

Every merge to `main` triggers:

1. Install dependencies
2. Lint
3. Type check
4. Unit tests
5. Integration tests
6. Build frontend
7. **Validate database migrations**
8. Deploy preview
9. Manual approval (production)
10. Production deployment

## 7. Environment Management

Separate **Local · Development · Staging · Production**, each with an
independent database, storage, API keys, and secrets. **Production credentials
are never reused outside production** (NFR-5).

## 8. Security

| Area            | Controls                                                              |
| --------------- | -------------------------------------------------------------------- |
| Authentication  | Supabase Auth, **MFA**, OAuth providers, session expiration, device management. |
| Authorization   | Role-based permissions, fine-grained permission matrix, workspace isolation, project-level access. |
| Data Protection | TLS in transit, encryption at rest, **signed URLs** for private files, soft deletes with audit logs. |

## 9. Compliance

Designed with future compliance in mind: **GDPR**, **Australian Privacy Act**,
data export, account-deletion workflows, consent management, and audit logging.

## 10. Monitoring & Observability

Metrics: API response times, database performance, realtime connections, queue
lengths, AI token usage, error rates, storage usage, active users.

Tooling: **Grafana, Prometheus, Sentry, OpenTelemetry.**

## 11. Performance

| Target                          | Budget            |
| ------------------------------- | ----------------- |
| Dashboard load                  | < 2 s             |
| API response (p95)              | < 300 ms          |
| Search                          | < 500 ms          |
| Message delivery                | near real time    |
| File uploads                    | resumable + progress |

Techniques: lazy loading, code splitting, query optimization, CDN caching, image
optimization.

## 12. Backup & Disaster Recovery

- **Backups:** daily database snapshots, storage replication, configuration
  backups.
- **Objectives:** RPO ≤ 15 minutes, RTO ≤ 1 hour.
- Restoration procedures are **tested regularly** — not assumed.

## 13. Scaling Strategy

Aligns with Volume 4's
[scalability roadmap](backend-architecture.md#23-scalability-roadmap):

| Phase           | Shape                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **1 — MVP**     | Single Supabase project, modular monolith, hundreds of users.         |
| **2 — Growth**  | Read replicas, background workers, dedicated AI service.              |
| **3 — Enterprise** | Multi-region, queue-based processing, independent messaging/notification/AI services. |

## 14. Testing Strategy

| Level        | Coverage                                                          |
| ------------ | ----------------------------------------------------------------- |
| Unit         | Business logic, utility functions, database helpers.              |
| Integration  | API endpoints, database interactions, authentication flows.       |
| End-to-End   | Login, create project, assign task, send invoice, client approval. |

All levels run in CI/CD (§6).

## 15. Deployment Strategy

```
Developer → Git Push → CI/CD → Tests → Preview → Approval → Production
```

Database migrations are **version-controlled and deployed alongside application
code**.

## 16. Launch Checklist

- [ ] Authentication tested
- [ ] RLS policies validated
- [ ] Permissions reviewed
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Error tracking active
- [ ] Email delivery verified
- [ ] Payment gateway tested
- [ ] Security review completed
- [ ] Documentation updated

## 17. Product Roadmap

| Version  | Scope                                                                 |
| -------- | --------------------------------------------------------------------- |
| **1.0**  | CEO/Worker/Client portals, CRM, Projects, Tasks, Messaging, Calendar, Invoices, Contracts, Meeting Notes. |
| **1.5**  | Automation builder, AI meeting summaries, time tracking, advanced reporting, Google Calendar. |
| **2.0**  | Mobile apps, white-label branding, public API, marketplace, plugin system, advanced AI agents. |
| **3.0**  | Multi-company management, cross-workspace analytics, enterprise SSO, data warehouse integration, industry modules. |

## 18. Product Principles

AgencyOS should remain: **fast, predictable, secure, extensible,
permission-aware, AI-assisted, API-first, mobile-friendly, accessible.** Every
new feature should strengthen these rather than add complexity.

## 19. Reconciliation with Prior Volumes

| Prior volume | Volume 5 resolves / extends |
| ------------ | --------------------------- |
| Vol. 1 open question: data residency | **Multi-region** in scaling Phase 3 (§13). |
| Vol. 1/4 deferred: CI/CD, infra, deployment target | Recommended stack + 10-step pipeline (§5–6, §15). |
| Vol. 4: AI Gateway | Specialized **AI agents** and the context→permission→retrieval pipeline (§2–3). |
| Vol. 4 open: monitoring tooling | Grafana / Prometheus / Sentry / OpenTelemetry (§10). |
| Vol. 2: Supabase Auth | Adds **MFA**, device management, session expiration (§8). |
| Cross-cutting: compliance | GDPR + Australian Privacy Act posture (§9). |

## 20. Complete Documentation Set

With five volumes, the blueprint is complete:

| Volume | Coverage |
| ------ | -------- |
| [1](../product/prd-volume-1.md) | Product vision, goals, architecture, requirements. |
| [2](database-architecture.md) | Database architecture, Supabase strategy, permissions, data model. |
| [3](frontend-architecture.md) | Frontend architecture, design system, UX, screen specs. |
| [4](backend-architecture.md) | Backend services, APIs, integrations, automation, event-driven architecture. |
| [5](production-operations.md) | AI, infrastructure, DevOps, security, testing, scaling, operations. |
</content>
