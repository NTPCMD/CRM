import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  const s = await db();
  let q = s.from("tasks").select("*").is("deleted_at", null).order("position").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();

  let body: { project_id?: string; title?: string; status?: string; priority?: string; assignee_id?: string; due_at?: string };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected a JSON body."); }

  if (!body.project_id) return fail("validation", "project_id is required.");
  if (!body.title?.trim()) return fail("validation", "Task title is required.");

  const s = await db();
  const { data, error } = await s
    .from("tasks")
    .insert({
      workspace_id: ctx.workspace.id,
      project_id: body.project_id,
      title: body.title.trim(),
      status: body.status ?? "todo",
      priority: body.priority ?? "medium",
      assignee_id: body.assignee_id ?? null,
      due_at: body.due_at ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) return fail("insert_failed", error.message, 400);
  return ok(data, {});
}
