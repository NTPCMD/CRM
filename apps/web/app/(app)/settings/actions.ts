"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function updateWorkspaceAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const name = str(formData.get("name"));
  if (!name) return { error: "Workspace name is required." };

  const s = await db();
  const { error } = await s
    .from("workspaces")
    .update({
      name,
      timezone: str(formData.get("timezone")) ?? "UTC",
      country: str(formData.get("country")),
      updated_by: ctx.userId,
    })
    .eq("id", ctx.workspace.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
