import type { Request, Response } from "express";
import {
  adminUserParamsSchema,
  createAdminUserSchema,
  resetAdminPasswordSchema,
  updateAdminUserSchema
} from "../schemas/admin-user.schema.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams } from "../shared/http/validation.js";
import {
  createTenantAdminUser,
  listTenantAdminUsers,
  resetTenantAdminPassword,
  updateTenantAdminUser
} from "../services/admin-user.service.js";
import type { AdminUserActor } from "../types/admin-user.types.js";

const getActor = (request: Request): AdminUserActor => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return {
    adminId: request.auth.userId,
    tenantId: request.auth.tenantId,
    role: request.auth.role
  };
};

export const listAdminUsersController = async (request: Request, response: Response) => {
  const adminUsers = await listTenantAdminUsers(getActor(request));

  ok(response, {
    adminUsers
  });
};

export const createAdminUserController = async (request: Request, response: Response) => {
  const input = parseBody(request, createAdminUserSchema);
  const adminUser = await createTenantAdminUser(getActor(request), input);

  created(response, {
    adminUser
  });
};

export const updateAdminUserController = async (request: Request, response: Response) => {
  const params = parseParams(request, adminUserParamsSchema);
  const input = parseBody(request, updateAdminUserSchema);
  const adminUser = await updateTenantAdminUser(getActor(request), params.adminId, input);

  ok(response, {
    adminUser
  });
};

export const resetAdminPasswordController = async (request: Request, response: Response) => {
  const params = parseParams(request, adminUserParamsSchema);
  const input = parseBody(request, resetAdminPasswordSchema);
  const adminUser = await resetTenantAdminPassword(getActor(request), params.adminId, input);

  ok(response, {
    adminUser
  });
};
