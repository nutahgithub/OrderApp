import type { AdminRole } from "../../lib/api/types";

export const managerRoles: AdminRole[] = ["OWNER", "MANAGER"];
export const staffOperationRoles: AdminRole[] = ["OWNER", "MANAGER", "STAFF"];

export const isRoleAllowed = (role: AdminRole | undefined, allowedRoles: AdminRole[]): boolean => {
  if (!role) {
    return false;
  }

  return role === "OWNER" || allowedRoles.includes(role);
};
