import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { PERMISSIONS } from "./permissions";
import type { Profile, Workspace } from "./types";

export interface AppContext {
  userId: string;
  profile: Profile | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  roleKey: string | null;
  grantsAll: boolean;
  isClient: boolean;
  permissions: Set<string>;
}

/**
 * Resolve the signed-in user's profile, active workspace, role, and effective
 * permission set. Returns null if not authenticated. The permission set mirrors
 * the DB's app.has_permission() logic (grants_all > role grant > allow, minus
 * explicit deny) so the UI can gate the same way RLS does.
 */
export async function getContext(): Promise<AppContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const base: AppContext = {
    userId: user.id,
    profile: null,
    workspace: null,
    workspaces: [],
    roleKey: null,
    grantsAll: false,
    isClient: false,
    permissions: new Set(),
  };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar, job_title, timezone")
      .eq("id", user.id)
      .maybeSingle();
    base.profile = (profile as Profile) ?? null;

    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id, role_id, roles(key, grants_all, is_client), workspaces(*)")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null);

    if (!members || members.length === 0) return base;

    const list = members
      .map((m) => m.workspaces as unknown as Workspace)
      .filter(Boolean);
    base.workspaces = list;

    const cookieStore = await cookies();
    const wanted = cookieStore.get("ws")?.value;
    const active =
      members.find((m) => m.workspace_id === wanted) ?? members[0];

    base.workspace = (active.workspaces as unknown as Workspace) ?? null;
    const role = active.roles as unknown as
      | { key: string; grants_all: boolean; is_client: boolean }
      | null;
    base.roleKey = role?.key ?? null;
    base.grantsAll = !!role?.grants_all;
    base.isClient = !!role?.is_client;

    if (base.grantsAll) {
      base.permissions = new Set(PERMISSIONS);
      return base;
    }

    const wsId = active.workspace_id;
    const [{ data: rolePerms }, { data: userPerms }] = await Promise.all([
      supabase.from("role_permissions").select("permissions(key)").eq("role_id", active.role_id),
      supabase
        .from("user_permissions")
        .select("effect, permissions(key)")
        .eq("workspace_id", wsId)
        .eq("profile_id", user.id)
        .is("deleted_at", null),
    ]);

    const set = new Set<string>();
    (rolePerms ?? []).forEach((r) => {
      const k = (r.permissions as unknown as { key: string } | null)?.key;
      if (k) set.add(k);
    });
    (userPerms ?? []).forEach((r) => {
      const k = (r.permissions as unknown as { key: string } | null)?.key;
      if (!k) return;
      if (r.effect === "allow") set.add(k);
      if (r.effect === "deny") set.delete(k);
    });
    base.permissions = set;
    return base;
  } catch {
    return base;
  }
}
