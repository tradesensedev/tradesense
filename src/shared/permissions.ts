import type { Role } from "./constants";

export const PERMISSIONS = [
  "post:create",
  "post:edit",
  "post:publish",
  "note:create",
  "note:edit",
  "note:publish",
  "result:create",
  "attachment:manage",
  "market:manage",
  "analyst:manage",
  "tag:manage",
  "event:manage",
  "rules:manage",
  "settings:manage",
  "user:manage",
  "plan:manage",
  "payment:manage",
  "subscription:manage",
  "audit:view",
  "list:export",
  "admin:access",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// Single source of truth. analyst = drafts only (service layer blocks publish).
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  editor: [
    "admin:access",
    "post:create",
    "post:edit",
    "post:publish",
    "note:create",
    "note:edit",
    "note:publish",
    "result:create",
    "attachment:manage",
    "tag:manage",
    "event:manage",
    "list:export",
  ],
  analyst: ["admin:access", "post:create", "post:edit", "note:create", "note:edit"],
  member: [],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: Role | undefined | null): boolean {
  return can(role, "admin:access");
}
