import type { Role } from "./types.ts";

export type PermissionAction =
  | "view_leads"
  | "create_leads"
  | "edit_leads"
  | "log_activities"
  | "delete_leads"
  | "edit_targets"
  | "invite_members"
  | "manage_billing"
  | "manage_api_keys";

const PERMISSION_MATRIX: Record<PermissionAction, Role[]> = {
  view_leads: ["OWNER", "ADMIN", "SALES_REP", "VIEWER"],
  create_leads: ["OWNER", "ADMIN", "SALES_REP"],
  edit_leads: ["OWNER", "ADMIN", "SALES_REP"],
  log_activities: ["OWNER", "ADMIN", "SALES_REP"],
  delete_leads: ["OWNER", "ADMIN"],
  edit_targets: ["OWNER", "ADMIN"],
  invite_members: ["OWNER", "ADMIN"],
  manage_billing: ["OWNER"],
  manage_api_keys: ["OWNER", "ADMIN"],
};

export function hasPermission(role: Role, action: PermissionAction): boolean {
  const allowedRoles = PERMISSION_MATRIX[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

export function assertPermission(role: Role, action: PermissionAction): void {
  if (!hasPermission(role, action)) {
    throw new Error(
      `Forbidden: Role '${role}' does not have permission to '${action}'.`,
    );
  }
}
