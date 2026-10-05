import type { Permission } from "@shared/permissions";

export interface NavItem {
  to: string;
  label: string;
  permission: Permission; // item is hidden (and its route blocked) without this permission
  end?: boolean;
}

// HOW TO ADD AN ADMIN SCREEN: 1) add an item here  2) add a <Route> in pages/Admin.tsx wrapped in <RequirePermission>
//  3) make sure the API route uses the same permission via requirePermission(...).
export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", permission: "admin:access", end: true },
  { to: "/admin/posts", label: "Posts", permission: "admin:access" },
  { to: "/admin/notes", label: "Killzone notes", permission: "admin:access" },
  { to: "/admin/markets", label: "Markets", permission: "market:manage" },
  { to: "/admin/analysts", label: "Analysts", permission: "analyst:manage" },
  { to: "/admin/tags", label: "Tags", permission: "tag:manage" },
  { to: "/admin/settings", label: "Settings", permission: "settings:manage" },
];
