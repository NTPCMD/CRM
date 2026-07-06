"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function inviteMemberAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  if (!ctx.grantsAll) return { error: "Only admins can invite members." };

  const email = str(formData.get("email"))?.toLowerCase();
  const roleId = str(formData.get("role_id"));
  if (!email) return { error: "Email is required." };
  if (!roleId) return { error: "Role is required." };

  const s = await db();
  const { data: profile } = await s.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) return { error: `No account found for ${email}. They must sign up first.` };

  // Check for existing membership.
  const { data: existing } = await s
    .from("workspace_members")
    .select("id, status")
    .eq("workspace_id", ctx.workspace.id)
    .eq("profile_id", profile.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    if (existing.status === "active") return { error: "This person is already a member." };
    // Reactivate a removed or declined invite.
    const { error } = await s
      .from("workspace_members")
      .update({ status: "invited", role_id: roleId, deleted_at: null, updated_by: ctx.userId })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/team");
    return {};
  }

  const { error } = await s.from("workspace_members").insert({
    workspace_id: ctx.workspace.id,
    profile_id: profile.id,
    role_id: roleId,
    status: "invited",
    created_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/team");
  return {};
}

export async function removeMemberAction(memberId: string): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  if (!ctx.grantsAll) return { error: "Only admins can remove members." };

  const s = await db();
  const { error } = await s
    .from("workspace_members")
    .update({ status: "removed", deleted_at: new Date().toISOString(), updated_by: ctx.userId })
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { error: error.message };
  revalidatePath("/team");
  return {};
}
