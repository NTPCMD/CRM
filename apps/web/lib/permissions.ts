/** Permission catalog — mirrors supabase/seed.sql (Volume 2 §10). */
export const PERMISSIONS = [
  "settings.manage", "users.manage", "permissions.manage",
  "crm.view", "crm.manage",
  "projects.view", "projects.manage",
  "tasks.view", "tasks.manage",
  "calendar.view", "calendar.manage",
  "messaging.internal", "messaging.client",
  "files.view", "files.manage",
  "contracts.view", "contracts.manage",
  "invoices.view", "invoices.manage",
  "finance.view",
  "meetingnotes.view", "meetingnotes.manage",
  "reports.view", "integrations.manage", "automation.manage", "activity.view",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export function can(perms: Set<string>, key: PermissionKey) {
  return perms.has(key);
}
