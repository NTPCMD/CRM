import { ok } from "@/lib/api/respond";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function GET() {
  return ok({ status: "ok", supabaseConfigured: hasSupabaseEnv, ts: new Date().toISOString() });
}
