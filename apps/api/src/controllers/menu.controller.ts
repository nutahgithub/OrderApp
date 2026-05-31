import type { Request, Response } from "express";
import {
  createMenuCategorySchema,
  createMenuSchema,
  menuCategoryParamsSchema,
  menuParamsSchema,
  publicMenuParamsSchema,
  updateMenuCategorySchema,
  updateMenuSchema
} from "../schemas/menu.schema.js";
import {
  createTenantMenu,
  createTenantMenuCategory,
  deleteTenantMenu,
  deleteTenantMenuCategory,
  listPublicQrMenus,
  listTenantMenuCategories,
  listTenantMenus,
  updateTenantMenu,
  updateTenantMenuCategory
} from "../services/menu.service.js";
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

const getAdminId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.userId;
};

export const listMenusController = async (request: Request, response: Response) => {
  const tenantId = getTenantId(request);
  const [menus, categories] = await Promise.all([listTenantMenus(tenantId), listTenantMenuCategories(tenantId)]);

  ok(response, {
    menus,
    categories
  });
};

export const listMenuCategoriesController = async (request: Request, response: Response) => {
  const categories = await listTenantMenuCategories(getTenantId(request));

  ok(response, {
    categories
  });
};

export const createMenuCategoryController = async (request: Request, response: Response) => {
  const input = parseBody(request, createMenuCategorySchema);
  const category = await createTenantMenuCategory(getTenantId(request), input);

  created(response, {
    category
  });
};

export const updateMenuCategoryController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuCategoryParamsSchema);
  const input = parseBody(request, updateMenuCategorySchema);
  const category = await updateTenantMenuCategory(getTenantId(request), params.categoryId, input);

  ok(response, {
    category
  });
};

export const deleteMenuCategoryController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuCategoryParamsSchema);
  await deleteTenantMenuCategory(getTenantId(request), params.categoryId);

  ok(response, {
    deleted: true
  });
};

export const createMenuController = async (request: Request, response: Response) => {
  const input = parseBody(request, createMenuSchema);
  const menu = await createTenantMenu(getTenantId(request), input, getAdminId(request));

  created(response, {
    menu
  });
};

export const updateMenuController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuParamsSchema);
  const input = parseBody(request, updateMenuSchema);
  const menu = await updateTenantMenu(getTenantId(request), params.menuId, input, getAdminId(request));

  ok(response, {
    menu
  });
};

export const deleteMenuController = async (request: Request, response: Response) => {
  const params = parseParams(request, menuParamsSchema);
  await deleteTenantMenu(getTenantId(request), params.menuId, getAdminId(request));

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
