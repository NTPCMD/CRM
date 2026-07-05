"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function createClientAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const name = str(formData.get("name"));
  if (!name) return { error: "Client name is required." };

  const s = await db();
  const { error } = await s.from("clients").insert({
    workspace_id: ctx.workspace.id,
    name,
    type: str(formData.get("type")) ?? "company",
    website: str(formData.get("website")),
    notes: str(formData.get("notes")),
    created_by: ctx.userId,
    updated_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/clients");
  return {};
}
