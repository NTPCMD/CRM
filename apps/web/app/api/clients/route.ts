import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const s = await db();
  const { data, error } = await s.from("clients").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();

  let body: { name?: string; type?: string; website?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return fail("invalid_body", "Expected a JSON body.");
  }
  if (!body.name?.trim()) return fail("validation", "Client name is required.");

  const s = await db();
  const { data, error } = await s
    .from("clients")
    .insert({
      workspace_id: ctx.workspace.id,
      name: body.name.trim(),
      type: body.type ?? "company",
      website: body.website ?? null,
      notes: body.notes ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) return fail("insert_failed", error.message, 400);
  return ok(data, {});
}
