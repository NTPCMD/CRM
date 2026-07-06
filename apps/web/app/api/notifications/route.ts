import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED } from "@/lib/api/respond";

export async function GET(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const s = await db();
  let q = s
    .from("notifications")
    .select("*")
    .eq("profile_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (unreadOnly) q = q.eq("read", false);
  const { data, error } = await q;
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0, unread: (data ?? []).filter((n) => !n.read).length });
}

export async function PATCH(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();

  let body: { ids?: string[]; all?: boolean };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected JSON."); }

  const s = await db();
  if (body.all) {
    const { error } = await s
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("profile_id", ctx.userId)
      .eq("read", false);
    if (error) return fail("update_failed", error.message, 500);
    return ok({ marked: "all" });
  }

  if (body.ids?.length) {
    const { error } = await s
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", body.ids)
      .eq("profile_id", ctx.userId);
    if (error) return fail("update_failed", error.message, 500);
    return ok({ marked: body.ids.length });
  }

  return fail("validation", "Provide ids[] or all:true.");
}
