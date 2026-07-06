"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function createCalendarEventAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };

  const title = str(formData.get("title"));
  const startsAt = str(formData.get("starts_at"));
  if (!title) return { error: "Event title is required." };
  if (!startsAt) return { error: "Start time is required." };

  const endsAt = str(formData.get("ends_at"));
  const allDay = formData.get("all_day") === "1";

  const s = await db();
  const { error } = await s.from("calendar_events").insert({
    workspace_id: ctx.workspace.id,
    title,
    type: str(formData.get("type")) ?? "event",
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    location: str(formData.get("location")),
    description: str(formData.get("description")),
    created_by: ctx.userId,
    updated_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}
