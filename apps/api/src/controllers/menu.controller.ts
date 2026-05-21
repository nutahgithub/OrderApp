import type { Request, Response } from "express";
import {
  createMenuSchema,
  menuParamsSchema,
  publicMenuParamsSchema,
  updateMenuSchema
} from "../schemas/menu.schema.js";
import { createTenantMenu, deleteTenantMenu, listPublicQrMenus, listTenantMenus, updateTenantMenu } from "../services/menu.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const listMenusController = async (request: Request, response: Response) => {
  const menus = await listTenantMenus(getTenantId(request));

  ok(response, {
    menus
  });
};

export const createMenuController = async (request: Request, response: Response) => {
  const input = parseBody(request, createMenuSchema);
  const menu = await createTenantMenu(getTenantId(request), input);

  created(response, {
    menu
  });
};

export const updateMenuController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuParamsSchema);
  const input = parseBody(request, updateMenuSchema);
  const menu = await updateTenantMenu(getTenantId(request), params.menuId, input);

  ok(response, {
    menu
  });
};

export const deleteMenuController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuParamsSchema);
  await deleteTenantMenu(getTenantId(request), params.menuId);

  ok(response, {
    deleted: true
  });
};

export const listPublicQrMenusController = async (request: Request, response: Response) => {
  const params = parseParams(request, publicMenuParamsSchema);
  const menus = await listPublicQrMenus(params.tenantId, params.branchId, params.tableId);

  ok(response, {
    menus
  });
};
