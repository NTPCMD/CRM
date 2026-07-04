# AgencyOS — Implementation Requirements & Access

This document tracks what implementation needs from you: what is already
provided, what is still required, and the current environment constraints. It is
updated as we build volume by volume.

## 1. Environment constraint (important)

This build runs in a sandboxed environment whose **network policy blocks
outbound connections to the Supabase project host**
(`pzcckoinamekuxiqeqog.supabase.co` returns `403` at the proxy). Consequences:

- I **cannot apply migrations or run the app against your hosted Supabase**
  project from here.
- I **can** author and **locally validate** all SQL against a throwaway
  PostgreSQL 16 instance (with `auth`/`storage` shims), so migrations are
  syntax- and logic-checked before commit.

**To let me apply/verify against your project directly**, an admin can allowlist
`*.supabase.co` for this environment (Claude Code settings / network policy).
Otherwise, you apply the migrations yourself — see §4.

## 2. Provided

| Item | Value / location | Notes |
| ---- | ---------------- | ----- |
| Supabase project URL | `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` | Public. |
| Supabase publishable (anon) key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` | Public by design (safe in the browser). |
| Project ref | `pzcckoinamekuxiqeqog` | Derived from the URL. |

## 3. Still required (fill into `.env.local`, never commit)

Provide these when the corresponding volume is implemented. **Do not paste
secrets into chat** unless you accept they may be logged — prefer setting them
locally or via the Supabase/hosting dashboards.

| Secret | Needed for | When |
| ------ | ---------- | ---- |
| `SUPABASE_DB_URL` **or** admin allowlist | Applying migrations from CI / this env | Volume 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin (invite users, webhooks, cron) | Volume 2/4 |
| `ANTHROPIC_API_KEY` | AI Gateway (default provider) | Volume 4/5 |
| `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` | Optional AI Gateway providers | Volume 5 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Invoicing / payments | Volume 4 |
| `RESEND_API_KEY` (or Postmark) | Transactional email / notifications | Volume 5 |
| Google OAuth client id/secret | Google login + Calendar sync | Volume 3/4 |

## 4. Applying the database migrations

The migrations live in [`supabase/migrations/`](../supabase/migrations) and the
seed in [`supabase/seed.sql`](../supabase/seed.sql). Two ways to apply them to
your hosted project:

**Option A — Supabase CLI (recommended), from a machine with network access:**

```bash
npm i -g supabase            # or: npx supabase ...
supabase link --project-ref pzcckoinamekuxiqeqog
supabase db push             # applies migrations
# then run the seed once:
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

**Option B — Dashboard SQL editor:** paste each migration file in order, then
`seed.sql`.

After applying, create your first workspace + CEO membership by calling the
`public.create_workspace(...)` RPC (see the migration notes) while signed in.

## 5. Build order (one volume at a time)

| Volume | Deliverable | Status |
| ------ | ----------- | ------ |
| 1 | Product/architecture docs | ✅ Complete |
| 2 | Database: schema, RBAC, RLS, functions, triggers | 🟡 In progress — foundation first |
| 3 | Next.js app: auth, design system, portals | ⬜ Next |
| 4 | API layer, Edge Functions, integrations | ⬜ |
| 5 | AI agents, CI/CD, observability, launch | ⬜ |

## 6. Design refinements made during implementation

Decisions taken while turning the spec into runnable code (all faithful to the
intent; noted so the docs and code stay reconciled):

- **Multi-workspace membership.** Volume 2 put `workspace_id` + `role` directly
  on `profiles`. Volume 3's workspace-selection step implies a user can belong
  to more than one workspace, so membership and per-workspace role live in a
  `workspace_members` table; `profiles` is the global identity (1:1 with
  `auth.users`). Global/platform tables (`workspaces`, `profiles`,
  `permissions`) are the documented exceptions to the "every table has
  `workspace_id`" rule.
- **Permission resolution** is implemented as `SECURITY DEFINER` helper
  functions in an `app` schema (`app.has_permission`, `app.is_member`,
  `app.is_admin`), so RLS policies are short and non-recursive. A role may
  `grants_all` (CEO); `user_permissions` carry `allow`/`deny` overrides, with
  `deny` winning.
</content>
