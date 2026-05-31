import type { AdminRole, AdminUser } from "@prisma/client";
import {
  createAdminUser,
  findAdminUserByTenant,
  findAdminUserByTenantEmail,
  listAdminUsersByTenant,
  updateAdminUserByTenant,
  updateAdminUserPasswordByTenant
} from "../repositories/admin-user.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import { hashPassword } from "../shared/security/password.js";
import type {
  AdminUserActor,
  AdminUserDto,
  CreateAdminUserInput,
  ResetAdminPasswordInput,
  UpdateAdminUserInput
} from "../types/admin-user.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const managerManagedRoles = new Set<AdminRole>(["STAFF"]);

const toAdminUserDto = (adminUser: AdminUser): AdminUserDto => {
  return {
    id: adminUser.id,
    tenantId: adminUser.tenantId,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
    isActive: adminUser.isActive,
    createdAt: adminUser.createdAt.toISOString(),
    updatedAt: adminUser.updatedAt.toISOString()
  };
};

const canManageRole = (actorRole: AdminRole, targetRole: AdminRole): boolean => {
  return actorRole === "OWNER" || managerManagedRoles.has(targetRole);
};

const assertCanAssignRole = (actorRole: AdminRole, role: AdminRole): void => {
  if (!canManageRole(actorRole, role)) {
    throw new AppError(ErrorCode.AdminRoleAssignmentForbidden);
  }
};

const assertCanManageTarget = (actorRole: AdminRole, targetRole: AdminRole): void => {
  if (!canManageRole(actorRole, targetRole)) {
    throw new AppError(ErrorCode.AdminRoleAssignmentForbidden);
  }
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const listTenantAdminUsers = async (actor: AdminUserActor): Promise<AdminUserDto[]> => {
  const adminUsers = await listAdminUsersByTenant(prisma, actor.tenantId);

  return adminUsers.map(toAdminUserDto);
};

export const createTenantAdminUser = async (
  actor: AdminUserActor,
  input: CreateAdminUserInput
): Promise<AdminUserDto> => {
  assertCanAssignRole(actor.role, input.role);

  const email = normalizeEmail(input.email);
  const existingAdminUser = await findAdminUserByTenantEmail(prisma, {
    tenantId: actor.tenantId,
    email
  });

  if (existingAdminUser) {
    throw new AppError(ErrorCode.AdminEmailAlreadyExists);
  }

  const adminUser = await createAdminUser(prisma, {
    tenantId: actor.tenantId,
    email,
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
    role: input.role
  });

  logger.info("admin_user_created", {
    tenantId: actor.tenantId,
    adminId: adminUser.id,
    role: adminUser.role
  });
  await recordAuditLog({
    tenantId: actor.tenantId,
    actorAdminId: actor.adminId,
    action: "ADMIN_USER_CREATED",
    resourceType: "ADMIN_USER",
    resourceId: adminUser.id,
    metadata: {
      role: adminUser.role
    }
  });

  return toAdminUserDto(adminUser);
};

export const updateTenantAdminUser = async (
  actor: AdminUserActor,
  adminId: string,
  input: UpdateAdminUserInput
): Promise<AdminUserDto> => {
  const target = await findAdminUserByTenant(prisma, {
    tenantId: actor.tenantId,
    adminId
  });

  if (!target) {
    throw new AppError(ErrorCode.AdminNotFound);
  }

  assertCanManageTarget(actor.role, target.role);

  if (input.role) {
    assertCanAssignRole(actor.role, input.role);
  }

  if (actor.adminId === adminId && (input.isActive === false || (input.role && input.role !== target.role))) {
    throw new AppError(ErrorCode.AdminSelfAccessChangeForbidden);
  }

  const email = input.email ? normalizeEmail(input.email) : undefined;

  if (email && email !== target.email) {
    const existingAdminUser = await findAdminUserByTenantEmail(prisma, {
      tenantId: actor.tenantId,
      email
    });

    if (existingAdminUser && existingAdminUser.id !== adminId) {
      throw new AppError(ErrorCode.AdminEmailAlreadyExists);
    }
  }

  const adminUser = await updateAdminUserByTenant(prisma, {
    tenantId: actor.tenantId,
    adminId,
    data: {
      ...(email ? { email } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {})
    }
  });

  if (!adminUser) {
    throw new AppError(ErrorCode.AdminNotFound);
  }

  logger.info("admin_user_updated", {
    tenantId: actor.tenantId,
    adminId,
    role: adminUser.role,
    isActive: adminUser.isActive
  });
  await recordAuditLog({
    tenantId: actor.tenantId,
    actorAdminId: actor.adminId,
    action: adminUser.isActive ? "ADMIN_USER_UPDATED" : "ADMIN_USER_DISABLED",
    resourceType: "ADMIN_USER",
    resourceId: adminUser.id,
    metadata: {
      role: adminUser.role,
      isActive: adminUser.isActive
    }
  });

  return toAdminUserDto(adminUser);
};

export const resetTenantAdminPassword = async (
  actor: AdminUserActor,
  adminId: string,
  input: ResetAdminPasswordInput
): Promise<AdminUserDto> => {
  const target = await findAdminUserByTenant(prisma, {
    tenantId: actor.tenantId,
    adminId
  });

  if (!target) {
    throw new AppError(ErrorCode.AdminNotFound);
  }

  assertCanManageTarget(actor.role, target.role);

  const adminUser = await updateAdminUserPasswordByTenant(prisma, {
    tenantId: actor.tenantId,
    adminId,
    passwordHash: hashPassword(input.password)
  });

  if (!adminUser) {
    throw new AppError(ErrorCode.AdminNotFound);
  }

  logger.info("admin_user_password_reset", {
    tenantId: actor.tenantId,
    adminId
  });
  await recordAuditLog({
    tenantId: actor.tenantId,
    actorAdminId: actor.adminId,
    action: "ADMIN_USER_PASSWORD_RESET",
    resourceType: "ADMIN_USER",
    resourceId: adminUser.id
  });

  return toAdminUserDto(adminUser);
};
