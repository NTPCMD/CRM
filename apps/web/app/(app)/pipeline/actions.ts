"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function createLeadAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const name = str(formData.get("name"));
  if (!name) return { error: "Lead name is required." };

  const s = await db();
  const valueRaw = str(formData.get("value"));
  const { error } = await s.from("leads").insert({
    workspace_id: ctx.workspace.id,
    name,
    company: str(formData.get("company")),
    email: str(formData.get("email")),
    stage: str(formData.get("stage")) ?? "lead",
    value: valueRaw ? Number(valueRaw) : 0,
    owner_id: ctx.userId,
    created_by: ctx.userId,
    updated_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/pipeline");
  return {};
}

export async function moveLeadAction(id: string, stage: string): Promise<{ error?: string }> {
  const s = await db();
  const { error } = await s.from("leads").update({ stage }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pipeline");
  return {};
}
