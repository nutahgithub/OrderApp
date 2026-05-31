import type { AdminRole } from "@prisma/client";

export type AdminUserDto = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserInput = {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
};

export type UpdateAdminUserInput = {
  email?: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export type ResetAdminPasswordInput = {
  password: string;
};

export type AdminUserActor = {
  adminId: string;
  tenantId: string;
  role: AdminRole;
};
