import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";
import { ok, fail, UNAUTHORIZED, NO_WORKSPACE } from "@/lib/api/respond";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();

  const s = await db();
  const { data, error } = await s
    .from("workspace_members")
    .select("id, status, role_id, profile_id, profiles(id, first_name, last_name, email, avatar, job_title), roles(id, name, key)")
    .eq("workspace_id", ctx.workspace?.id ?? "")
    .eq("status", "active")
    .is("deleted_at", null);
  if (error) return fail("query_failed", error.message, 500);
  return ok(data ?? [], { count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return UNAUTHORIZED();
  if (!ctx.workspace) return NO_WORKSPACE();
  if (!ctx.grantsAll) return fail("forbidden", "Only admins can invite members.", 403);

  let body: { email?: string; role_id?: string };
  try { body = await request.json(); } catch { return fail("invalid_body", "Expected a JSON body."); }
  const email = body.email?.trim().toLowerCase();
  if (!email) return fail("validation", "Email is required.");
  if (!body.role_id) return fail("validation", "role_id is required.");

  const s = await db();

  // Look up the profile by email (may not exist yet — invite creates a placeholder).
  const { data: profile } = await s.from("profiles").select("id").eq("email", email).maybeSingle();

  if (!profile) {
    // Profile doesn't exist — use Supabase Auth admin invite (service role required at runtime).
    // For now we return a structured error prompting the caller to use the Supabase dashboard.
    return fail("no_profile", `No profile found for ${email}. Ask them to sign up first.`, 404);
  }

  const { data, error } = await s
    .from("workspace_members")
    .insert({
      workspace_id: ctx.workspace.id,
      profile_id: profile.id,
      role_id: body.role_id,
      status: "invited",
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return fail("insert_failed", error.message, 400);
  return ok(data, {});
}
