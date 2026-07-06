// stripe-webhook — verify Stripe events and reconcile payments/invoices.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Required secrets: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(k: string): string | undefined } };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Minimal Stripe signature verification without importing the full SDK.
// Algorithm: HMAC-SHA256 over "timestamp.payload" keyed by the webhook secret.
async function verifyStripeSignature(payload: string, sig: string, secret: string): Promise<boolean> {
  const parts = sig.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  // Reject replays older than 5 minutes.
  const delta = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (delta > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === v1;
}

// Minimal Supabase REST client for service-role writes.
function makeAdmin(url: string, key: string) {
  const headers = {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  async function upsert(table: string, row: Record<string, unknown>, onConflict: string) {
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });
    return res.json();
  }

  async function update(table: string, where: Record<string, string>, data: Record<string, unknown>) {
    const qs = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    const res = await fetch(`${url}/rest/v1/${table}?${qs}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async function select<T>(table: string, query: string): Promise<T[]> {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, { headers });
    return res.json() as Promise<T[]>;
  }

  return { upsert, update, select };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();

  if (!webhookSecret || !sig) return json({ error: "missing signature or secret" }, 400);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "missing supabase env" }, 500);

  const valid = await verifyStripeSignature(payload, sig, webhookSecret);
  if (!valid) return json({ error: "invalid signature" }, 401);

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "invalid payload" }, 400);
  }

  const admin = makeAdmin(supabaseUrl, serviceRoleKey);

  switch (event.type) {
    case "invoice.paid": {
      const stripeInv = event.data.object;
      const stripeInvoiceId: string = stripeInv.id;
      const amountPaid: number = Math.round((stripeInv.amount_paid ?? 0) / 100); // cents → dollars
      const currency: string = (stripeInv.currency ?? "usd").toUpperCase();
      const customerId: string | null = stripeInv.customer ?? null;

      // Find the AgencyOS invoice by the stripe metadata field or customer id.
      let agencyInvoiceId: string | null = stripeInv.metadata?.agency_invoice_id ?? null;

      if (!agencyInvoiceId && customerId) {
        const rows = await admin.select<{ id: string }>(
          "invoices",
          `stripe_customer_id=eq.${encodeURIComponent(customerId)}&status=eq.sent&order=created_at.desc&limit=1`,
        );
        agencyInvoiceId = rows[0]?.id ?? null;
      }

      // Record the payment with idempotency on provider_ref.
      await admin.upsert(
        "payments",
        {
          provider: "stripe",
          provider_ref: stripeInvoiceId,
          invoice_id: agencyInvoiceId,
          amount: amountPaid,
          currency,
          status: "succeeded",
          paid_at: new Date().toISOString(),
        },
        "provider_ref",
      );

      // Mark the AgencyOS invoice as paid.
      if (agencyInvoiceId) {
        await admin.update("invoices", { id: agencyInvoiceId }, { status: "paid" });
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const amount: number = Math.round((pi.amount ?? 0) / 100);
      const currency: string = (pi.currency ?? "usd").toUpperCase();
      const agencyInvoiceId: string | null = pi.metadata?.agency_invoice_id ?? null;

      await admin.upsert(
        "payments",
        {
          provider: "stripe",
          provider_ref: pi.id,
          invoice_id: agencyInvoiceId,
          amount,
          currency,
          status: "succeeded",
          paid_at: new Date().toISOString(),
        },
        "provider_ref",
      );

      if (agencyInvoiceId) {
        await admin.update("invoices", { id: agencyInvoiceId }, { status: "paid" });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      await admin.upsert(
        "payments",
        {
          provider: "stripe",
          provider_ref: pi.id,
          invoice_id: pi.metadata?.agency_invoice_id ?? null,
          amount: Math.round((pi.amount ?? 0) / 100),
          currency: (pi.currency ?? "usd").toUpperCase(),
          status: "failed",
        },
        "provider_ref",
      );
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // Future: reconcile workspace plan tier.
      break;
    }

    default:
      break;
  }

  return json({ received: true });
});
