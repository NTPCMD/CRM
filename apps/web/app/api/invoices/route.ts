import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const status = searchParams.get("status");

  const s = await db();
  let q = s.from("invoices").select("*, invoice_items(*)").is("deleted_at", null).order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();

  let body: {
    client_id?: string;
    currency?: string;
    due_date?: string;
    items?: Array<{ description: string; quantity: number; unit_price: number }>;
  };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected a JSON body."); }

  const items = (body.items ?? []).filter((i) => i.description?.trim());
  if (items.length === 0) return fail("validation", "At least one line item is required.");

  const s = await db();
  const { data: number } = await s.rpc("generate_invoice_number", { p_ws: ctx.workspace.id });

  const { data: invoice, error } = await s
    .from("invoices")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: body.client_id ?? null,
      number: number ?? null,
      status: "draft",
      currency: body.currency ?? "USD",
      due_date: body.due_date ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return fail("insert_failed", error.message, 400);

  const { error: itemErr } = await s.from("invoice_items").insert(
    items.map((it, idx) => ({
      workspace_id: ctx.workspace!.id,
      invoice_id: invoice!.id,
      description: it.description.trim(),
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      position: idx,
    })),
  );
  if (itemErr) return fail("insert_failed", itemErr.message, 400);

  const { data: full } = await s.from("invoices").select("*, invoice_items(*)").eq("id", invoice!.id).single();
  return ok(full, {});
}
