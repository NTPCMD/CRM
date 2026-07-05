import { createClient } from "./supabase/server";

export async function listAllTasks() {
  const s = await createClient();
  const { data } = await s
    .from("tasks")
    .select("id, title, status, priority, project_id, projects(name)")
    .is("deleted_at", null)
    .order("position");
  return (data ?? []) as unknown as Array<{
    id: string; title: string; status: string; priority: string;
    project_id: string; projects: { name: string } | null;
  }>;
}

export async function listLeads() {
  const s = await createClient();
  const { data } = await s.from("leads").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; name: string; company: string | null; stage: string; value: number | null; owner_id: string | null;
  }>;
}

export async function listContracts() {
  const s = await createClient();
  const { data } = await s
    .from("contracts")
    .select("id, title, status, current_version, clients(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; title: string; status: string; current_version: number; clients: { name: string } | null;
  }>;
}

export async function listFiles() {
  const s = await createClient();
  const { data } = await s
    .from("files")
    .select("id, name, bucket, mime_type, size_bytes, is_client_visible, created_at, projects(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; name: string; bucket: string; mime_type: string | null; size_bytes: number | null;
    is_client_visible: boolean; created_at: string; projects: { name: string } | null;
  }>;
}

export async function listMembers() {
  const s = await createClient();
  const { data } = await s
    .from("workspace_members")
    .select("id, status, roles(key, name), profiles(id, first_name, last_name, email, job_title)")
    .is("deleted_at", null);
  return (data ?? []) as unknown as Array<{
    id: string; status: string;
    roles: { key: string; name: string } | null;
    profiles: { id: string; first_name: string | null; last_name: string | null; email: string | null; job_title: string | null } | null;
  }>;
}

export async function listRolesWithPermissions() {
  const s = await createClient();
  const { data } = await s
    .from("roles")
    .select("id, key, name, grants_all, role_permissions(permissions(key))")
    .is("deleted_at", null)
    .order("grants_all", { ascending: false });
  return (data ?? []) as unknown as Array<{
    id: string; key: string; name: string; grants_all: boolean;
    role_permissions: Array<{ permissions: { key: string } | null }>;
  }>;
}

export async function listCalendarEvents() {
  const s = await createClient();
  const { data } = await s
    .from("calendar_events")
    .select("id, title, type, starts_at, ends_at, all_day, location, visibility, project_id")
    .is("deleted_at", null)
    .order("starts_at");
  return (data ?? []) as unknown as Array<{
    id: string; title: string; type: string; starts_at: string; ends_at: string | null;
    all_day: boolean; location: string | null; visibility: string; project_id: string | null;
  }>;
}
