"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

export async function sendMessageAction(conversationId: string, body: string): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const text = body.trim();
  if (!text) return { error: "Message is empty." };

  const s = await db();
  const { data: conv } = await s
    .from("conversations")
    .select("scope")
    .eq("id", conversationId)
    .maybeSingle();

  const { error } = await s.from("messages").insert({
    workspace_id: ctx.workspace.id,
    conversation_id: conversationId,
    author_id: ctx.userId,
    body: text,
    is_internal: conv?.scope === "internal",
  });
  if (error) return { error: error.message };
  revalidatePath("/messages");
  return {};
}
