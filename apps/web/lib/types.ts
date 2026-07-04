export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  status: string;
  timezone: string;
  country: string | null;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar: string | null;
  job_title: string | null;
  timezone: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  status: string;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  client_id: string | null;
  name: string;
  number: string | null;
  status: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  health_score: number | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_at: string | null;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  client_id: string | null;
  number: string | null;
  status: string;
  currency: string;
  due_date: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  object_type: string | null;
  object_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string | null;
}

export type Role = "ceo" | "worker" | "client";
