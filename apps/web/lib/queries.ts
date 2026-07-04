import { createClient } from "./supabase/server";
import type { Client, Invoice, Project, ActivityLog } from "./types";

/** All queries run under the user's RLS context, so they only ever return rows
 *  the caller is authorized to see. Failures degrade to empty results. */

export async function listClients(): Promise<Client[]> {
  const s = await createClient();
  const { data } = await s
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data as Client[]) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const s = await createClient();
  const { data } = await s.from("clients").select("*").eq("id", id).maybeSingle();
  return (data as Client) ?? null;
}

export async function listProjects(clientId?: string): Promise<Project[]> {
  const s = await createClient();
  let q = s.from("projects").select("*").is("deleted_at", null);
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q.order("created_at", { ascending: false });
  return (data as Project[]) ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const s = await createClient();
  const { data } = await s.from("projects").select("*").eq("id", id).maybeSingle();
  return (data as Project) ?? null;
}

export async function listTasks(projectId: string) {
  const s = await createClient();
  const { data } = await s
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("position");
  return data ?? [];
}

export async function listInvoices(clientId?: string): Promise<Invoice[]> {
  const s = await createClient();
  let q = s.from("invoices").select("*").is("deleted_at", null);
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q.order("created_at", { ascending: false });
  return (data as Invoice[]) ?? [];
}

export async function listActivity(limit = 8): Promise<ActivityLog[]> {
  const s = await createClient();
  const { data } = await s
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ActivityLog[]) ?? [];
}

export interface DashboardStats {
  clients: number;
  projects: number;
  openInvoices: number;
  tasksDue: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const s = await createClient();
  const count = (table: string, mod?: (q: any) => any) => {
    let q = s.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (mod) q = mod(q);
    return q;
  };
  try {
    const [clients, projects, invoices, tasks] = await Promise.all([
      count("clients"),
      count("projects", (q) => q.eq("status", "active")),
      count("invoices", (q) => q.in("status", ["sent", "viewed", "overdue"])),
      count("tasks", (q) => q.neq("status", "done")),
    ]);
    return {
      clients: clients.count ?? 0,
      projects: projects.count ?? 0,
      openInvoices: invoices.count ?? 0,
      tasksDue: tasks.count ?? 0,
    };
  } catch {
    return { clients: 0, projects: 0, openInvoices: 0, tasksDue: 0 };
  }
}
