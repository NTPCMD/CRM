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
  let q = s.from("contracts").select("*, contract_versions(version, status, created_at)").is("deleted_at", null).order("created_at", { ascending: false });
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

  let body: { title?: string; client_id?: string; project_id?: string; body?: string; currency?: string; value?: number };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected a JSON body."); }
  if (!body.title?.trim()) return fail("validation", "Contract title is required.");

  const s = await db();
  const { data: contract, error } = await s
    .from("contracts")
    .insert({
      workspace_id: ctx.workspace.id,
      title: body.title.trim(),
      client_id: body.client_id ?? null,
      project_id: body.project_id ?? null,
      status: "draft",
      currency: body.currency ?? "USD",
      value: body.value ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return fail("insert_failed", error.message, 400);

  // Create first version with the body content.
  if (body.body?.trim()) {
    await s.from("contract_versions").insert({
      workspace_id: ctx.workspace.id,
      contract_id: contract!.id,
      version: 1,
      body: body.body.trim(),
      status: "draft",
      created_by: ctx.userId,
    });
  }

  return ok(contract, {});
}
