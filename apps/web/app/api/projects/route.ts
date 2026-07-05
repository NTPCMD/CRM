import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const s = await db();
  const { data, error } = await s.from("projects").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();

  let body: { name?: string; client_id?: string; due_date?: string; budget?: number };
  try {
    body = await request.json();
  } catch {
    return fail("invalid_body", "Expected a JSON body.");
  }
  if (!body.name?.trim()) return fail("validation", "Project name is required.");

  const s = await db();
  const { data: number } = await s.rpc("generate_project_number", { p_ws: ctx.workspace.id });
  const { data, error } = await s
    .from("projects")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: body.client_id ?? null,
      name: body.name.trim(),
      number: number ?? null,
      status: "active",
      due_date: body.due_date ?? null,
      budget: body.budget ?? null,
      health_score: 50,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) return fail("insert_failed", error.message, 400);

  if (data?.id) {
    await s.from("project_members").insert({
      workspace_id: ctx.workspace.id,
      project_id: data.id,
      profile_id: ctx.userId,
      role: "lead",
      created_by: ctx.userId,
    });
  }
  return ok(data, {});
}
