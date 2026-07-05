# AgencyOS Edge Functions (Volume 4)

Supabase Edge Functions (Deno) for work that shouldn't run in the client or a
Next.js request: AI generation, PDF rendering, webhooks, and scheduled jobs.
See the catalogue in [Volume 4 §7](../../docs/architecture/backend-architecture.md#7-edge-functions).

## Deploy

From a machine with network access to Supabase:

```bash
supabase functions deploy generate-ai-response
supabase secrets set ANTHROPIC_API_KEY=... STRIPE_WEBHOOK_SECRET=...
```

## Conventions

- Every function verifies the caller (JWT) or a provider signature (webhooks).
- Functions run under the caller's context where possible so RLS still applies.
- Secrets come from `Deno.env`, never hard-coded.

## Functions

| Function | Purpose | Status |
| -------- | ------- | ------ |
| `generate-ai-response` | Provider-agnostic AI completion (default Claude). | scaffolded |
| `stripe-webhook` | Verify + process Stripe events (invoice.paid → mark paid). | scaffolded |

Remaining catalogue (invite-user, send-invoice, generate-pdf,
summarize-meeting, calendar-sync, github-webhook, …) follow the same shape.
