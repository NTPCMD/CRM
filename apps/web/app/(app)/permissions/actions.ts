"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

export async function toggleRolePermissionAction(
  roleId: string,
  permKey: string,
  on: boolean,
): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };

  const s = await db();
  const { data: perm } = await s.from("permissions").select("id").eq("key", permKey).maybeSingle();
  if (!perm) return { error: "Unknown permission." };

  if (on) {
    const { error } = await s
      .from("role_permissions")
      .upsert({ role_id: roleId, permission_id: perm.id }, { onConflict: "role_id,permission_id" });
    if (error) return { error: error.message };
  } else {
    const { error } = await s
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", perm.id);
    if (error) return { error: error.message };
  }
  revalidatePath("/permissions");
  return {};
}
