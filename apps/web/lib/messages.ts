import { createClient } from "./supabase/server";

export async function listConversations() {
  const s = await createClient();
  const { data } = await s
    .from("conversations")
    .select("id, title, scope, project_id")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; title: string | null; scope: string; project_id: string | null;
  }>;
}

export async function listMessages(conversationId: string) {
  const s = await createClient();
  const { data } = await s
    .from("messages")
    .select("id, body, author_id, is_internal, created_at, profiles(first_name, last_name)")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at");
  return (data ?? []) as unknown as Array<{
    id: string; body: string; author_id: string | null; is_internal: boolean; created_at: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }>;
}
