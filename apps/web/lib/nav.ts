import type { PermissionKey } from "./permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  perm?: PermissionKey; // required permission to show the item
  group?: string;
}

/** The full nav; the sidebar filters items by the user's effective permissions
 *  so each role sees exactly what it's allowed to (the role-gating from Vol. 3). */
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutGrid" },
  { label: "Clients", href: "/clients", icon: "Users", perm: "crm.view" },
  { label: "Pipeline", href: "/pipeline", icon: "Filter", perm: "crm.view" },
  { label: "Projects", href: "/projects", icon: "FolderKanban", perm: "projects.view" },
  { label: "Tasks", href: "/tasks", icon: "CircleCheck", perm: "tasks.view" },
  { label: "Calendar", href: "/calendar", icon: "Calendar", perm: "calendar.view" },
  { label: "Messages", href: "/messages", icon: "MessageSquare", perm: "messaging.client" },
  { label: "Files", href: "/files", icon: "File", perm: "files.view" },
  { label: "Contracts", href: "/contracts", icon: "FileText", perm: "contracts.view" },
  { label: "Invoices", href: "/invoices", icon: "ReceiptText", perm: "invoices.view" },
  { label: "Analytics", href: "/analytics", icon: "ChartNoAxesColumn", perm: "reports.view", group: "Manage" },
  { label: "Team", href: "/team", icon: "Users", perm: "users.manage" },
  { label: "Permissions", href: "/permissions", icon: "Shield", perm: "permissions.manage" },
  { label: "Integrations", href: "/integrations", icon: "Plug", perm: "integrations.manage" },
  { label: "Automation", href: "/automation", icon: "Zap", perm: "automation.manage" },
  { label: "Settings", href: "/settings", icon: "Settings", perm: "settings.manage" },
];

export function visibleNav(perms: Set<string>): NavItem[] {
  return NAV.filter((n) => !n.perm || perms.has(n.perm));
}
