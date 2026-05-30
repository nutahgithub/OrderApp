import type { AdminRole } from "@prisma/client";
import { findAdminByEmail, findAdminByIdAndTenant } from "../repositories/auth.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { hashForLog, logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import { createAdminToken } from "../shared/security/jwt.js";
import { verifyPassword } from "../shared/security/password.js";
import type { AdminProfile, LoginInput, LoginResult } from "../types/auth.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const toAdminProfile = (admin: {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: AdminRole;
  tenant: {
    id: string;
    name: string;
  };
}): AdminProfile => {
  return {
    id: admin.id,
    tenantId: admin.tenantId,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    tenant: admin.tenant
  };
};

export const loginAdmin = async (input: LoginInput): Promise<LoginResult> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const admin = await findAdminByEmail(prisma, normalizedEmail);

  if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
    logger.warn("admin_login_failed", {
      emailHash: hashForLog(normalizedEmail)
    });

    throw new AppError(ErrorCode.InvalidCredentials);
  }

  const profile = toAdminProfile(admin);
  const token = createAdminToken({
    sub: admin.id,
    tenantId: admin.tenantId,
    role: admin.role
  });

  logger.info("admin_login_succeeded", {
    adminId: admin.id,
    tenantId: admin.tenantId,
    role: admin.role
  });
  await recordAuditLog({
    tenantId: admin.tenantId,
    actorAdminId: admin.id,
    action: "ADMIN_LOGIN",
    resourceType: "ADMIN_USER",
    resourceId: admin.id,
    metadata: {
      role: admin.role
    }
  });

  return {
    token,
    admin: profile
  };
};

export const getCurrentAdmin = async (userId: string, tenantId: string): Promise<AdminProfile> => {
  const admin = await findAdminByIdAndTenant(prisma, userId, tenantId);

  if (!admin) {
    throw new AppError(ErrorCode.AdminNotFound);
  }

  return toAdminProfile(admin);
};
