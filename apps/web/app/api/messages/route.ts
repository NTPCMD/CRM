import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const { searchParams } = new URL(request.url);
  const convId = searchParams.get("conversation_id");

  const s = await db();
  if (convId) {
    const { data, error } = await s
      .from("messages")
      .select("*, profiles(first_name, last_name, email, avatar)")
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("created_at");
    if (error) return fail("query_failed", error.message, 500);
    return ok(data ?? [], { count: data?.length ?? 0 });
  }

  // Return conversations list when no conversation_id given.
  const { data, error } = await s
    .from("conversations")
    .select("id, title, scope, project_id, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();

  let body: { conversation_id?: string; body?: string; is_internal?: boolean };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected a JSON body."); }

  if (!body.conversation_id) return fail("validation", "conversation_id is required.");
  const text = body.body?.trim();
  if (!text) return fail("validation", "Message body is required.");

  const s = await db();
  const { data: conv } = await s.from("conversations").select("scope").eq("id", body.conversation_id).maybeSingle();
  const isInternal = body.is_internal ?? (conv?.scope === "internal");

  if (isInternal && ctx.isClient) return fail("forbidden", "Clients may not post internal messages.", 403);

  const { data, error } = await s
    .from("messages")
    .insert({
      workspace_id: ctx.workspace.id,
      conversation_id: body.conversation_id,
      author_id: ctx.userId,
      body: text,
      is_internal: isInternal,
    })
    .select("*")
    .single();
  if (error) return fail("insert_failed", error.message, 400);
  return ok(data, {});
}
