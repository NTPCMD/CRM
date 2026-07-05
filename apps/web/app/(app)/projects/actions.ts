"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

export async function createProjectAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const name = str(formData.get("name"));
  if (!name) return { error: "Project name is required." };

  const s = await db();
  const { data: number } = await s.rpc("generate_project_number", { p_ws: ctx.workspace.id });
  const budgetRaw = str(formData.get("budget"));

  const { data: project, error } = await s
    .from("projects")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: str(formData.get("client_id")),
      name,
      number: number ?? null,
      status: "active",
      due_date: str(formData.get("due_date")),
      budget: budgetRaw ? Number(budgetRaw) : null,
      health_score: 50,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Make the creator a project member so project-scoped RLS grants them access.
  if (project?.id) {
    await s.from("project_members").insert({
      workspace_id: ctx.workspace.id,
      project_id: project.id,
      profile_id: ctx.userId,
      role: "lead",
      created_by: ctx.userId,
    });
  }

  revalidatePath("/projects");
  return {};
}

export async function createTaskAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };
  const projectId = str(formData.get("project_id"));
  const title = str(formData.get("title"));
  if (!projectId) return { error: "Missing project." };
  if (!title) return { error: "Task title is required." };

  const s = await db();
  const { error } = await s.from("tasks").insert({
    workspace_id: ctx.workspace.id,
    project_id: projectId,
    title,
    status: str(formData.get("status")) ?? "todo",
    priority: str(formData.get("priority")) ?? "medium",
    created_by: ctx.userId,
    updated_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function setTaskStatusAction(id: string, status: string, projectId: string): Promise<{ error?: string }> {
  const s = await db();
  const { error } = await s.from("tasks").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}
