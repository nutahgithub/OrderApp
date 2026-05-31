import { Prisma } from "@prisma/client";
import type { Menu } from "@prisma/client";
import { findTableQrEntry } from "../repositories/table.repository.js";
import {
  countMenuOrderItemsByTenant,
  createMenuCategory,
  createMenu,
  deleteMenuCategoryByTenant,
  deleteMenuByTenant,
  findMenuCategoryByTenant,
  listActiveMenusByTenant,
  listMenuCategoriesByTenant,
  listMenusByTenant,
  updateMenuCategoryByTenant,
  updateMenuByTenant
} from "../repositories/menu.repository.js";
import type { MenuWithCategory, MenuWithUsage } from "../repositories/menu.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type {
  CreateMenuCategoryInput,
  CreateMenuInput,
  MenuCategoryDto,
  MenuDto,
  UpdateMenuCategoryInput,
  UpdateMenuInput
} from "../types/menu.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const normalizePrice = (price: string): string => {
  return new Prisma.Decimal(price).toFixed(2);
};

const toMenuDto = (menu: Menu | MenuWithCategory | MenuWithUsage): MenuDto => {
  const category = "category" in menu ? menu.category : null;

  return {
    id: menu.id,
    tenantId: menu.tenantId,
    categoryId: menu.categoryId,
    categoryName: category?.name ?? null,
    categorySortOrder: category?.sortOrder ?? null,
    name: menu.name,
    price: menu.price.toFixed(2),
    imageUrl: menu.imageUrl,
    isActive: menu.isActive,
    isOutOfStock: menu.isOutOfStock,
    isFeatured: menu.isFeatured,
    isNew: menu.isNew,
    sortOrder: menu.sortOrder,
    canDelete: "_count" in menu ? menu._count.items === 0 : false,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString()
  };
};

const toMenuCategoryDto = (category: { id: string; tenantId: string; name: string; sortOrder: number; createdAt: Date; updatedAt: Date }): MenuCategoryDto => {
  return {
    id: category.id,
    tenantId: category.tenantId,
    name: category.name,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
};

const normalizeSortOrder = (sortOrder?: number): number => {
  return sortOrder ?? 0;
};

const ensureCategoryBelongsToTenant = async (tenantId: string, categoryId?: string | null): Promise<void> => {
  if (!categoryId) {
    return;
  }

  const category = await findMenuCategoryByTenant(prisma, {
    tenantId,
    categoryId
  });

  if (!category) {
    throw new AppError(ErrorCode.MenuCategoryNotFound);
  }
};

export const listTenantMenus = async (tenantId: string): Promise<MenuDto[]> => {
  const menus = await listMenusByTenant(prisma, tenantId);

  return menus.map(toMenuDto);
};

export const listTenantMenuCategories = async (tenantId: string): Promise<MenuCategoryDto[]> => {
  const categories = await listMenuCategoriesByTenant(prisma, tenantId);

  return categories.map(toMenuCategoryDto);
};

export const createTenantMenuCategory = async (
  tenantId: string,
  input: CreateMenuCategoryInput
): Promise<MenuCategoryDto> => {
  const category = await createMenuCategory(prisma, {
    tenantId,
    name: input.name.trim(),
    sortOrder: normalizeSortOrder(input.sortOrder)
  });

  return toMenuCategoryDto(category);
};

export const updateTenantMenuCategory = async (
  tenantId: string,
  categoryId: string,
  input: UpdateMenuCategoryInput
): Promise<MenuCategoryDto> => {
  const category = await updateMenuCategoryByTenant(prisma, {
    tenantId,
    categoryId,
    name: input.name.trim(),
    sortOrder: input.sortOrder
  });

  if (!category) {
    throw new AppError(ErrorCode.MenuCategoryNotFound);
  }

  return toMenuCategoryDto(category);
};

export const deleteTenantMenuCategory = async (tenantId: string, categoryId: string): Promise<void> => {
  const deletedCount = await deleteMenuCategoryByTenant(prisma, {
    tenantId,
    categoryId
  });

  if (deletedCount === 0) {
    throw new AppError(ErrorCode.MenuCategoryNotFound);
  }
};

export const createTenantMenu = async (
  tenantId: string,
  input: CreateMenuInput,
  actorAdminId?: string
): Promise<MenuDto> => {
  await ensureCategoryBelongsToTenant(tenantId, input.categoryId);

  const menu = await createMenu(prisma, {
    tenantId,
    name: input.name.trim(),
    price: normalizePrice(input.price),
    imageUrl: input.imageUrl ?? null,
    categoryId: input.categoryId ?? null,
    isActive: input.isActive,
    isOutOfStock: input.isOutOfStock,
    isFeatured: input.isFeatured,
    isNew: input.isNew,
    sortOrder: normalizeSortOrder(input.sortOrder)
  });

  logger.info("menu_created", {
    tenantId,
    menuId: menu.id,
    isActive: menu.isActive
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "MENU_CREATED",
    resourceType: "MENU",
    resourceId: menu.id,
    metadata: {
      isActive: menu.isActive,
      isOutOfStock: menu.isOutOfStock,
      categoryId: menu.categoryId
    }
  });

  return toMenuDto(menu);
};

export const updateTenantMenu = async (
  tenantId: string,
  menuId: string,
  input: UpdateMenuInput,
  actorAdminId?: string
): Promise<MenuDto> => {
  await ensureCategoryBelongsToTenant(tenantId, input.categoryId);

  const menu = await updateMenuByTenant(prisma, {
    tenantId,
    menuId,
    name: input.name.trim(),
    price: normalizePrice(input.price),
    imageUrl: input.imageUrl ?? null,
    categoryId: input.categoryId ?? null,
    isActive: input.isActive,
    isOutOfStock: input.isOutOfStock,
    isFeatured: input.isFeatured,
    isNew: input.isNew,
    sortOrder: input.sortOrder
  });

  if (!menu) {
    throw new AppError(ErrorCode.MenuNotFound);
  }

  logger.info("menu_updated", {
    tenantId,
    menuId: menu.id,
    isActive: menu.isActive
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "MENU_UPDATED",
    resourceType: "MENU",
    resourceId: menu.id,
    metadata: {
      isActive: menu.isActive,
      isOutOfStock: menu.isOutOfStock,
      categoryId: menu.categoryId
    }
  });

  return toMenuDto(menu);
};

export const deleteTenantMenu = async (tenantId: string, menuId: string, actorAdminId?: string): Promise<void> => {
  const orderItemCount = await countMenuOrderItemsByTenant(prisma, {
    tenantId,
    menuId
  });

  if (orderItemCount === null) {
    throw new AppError(ErrorCode.MenuNotFound);
  }

  if (orderItemCount > 0) {
    throw new AppError(ErrorCode.MenuInUse);
  }

  const deletedCount = await deleteMenuByTenant(prisma, {
    tenantId,
    menuId
  });

  if (deletedCount === 0) {
    throw new AppError(ErrorCode.MenuNotFound);
  }

  logger.info("menu_deleted", {
    tenantId,
    menuId
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "MENU_DELETED",
    resourceType: "MENU",
    resourceId: menuId
  });
};

export const listPublicQrMenus = async (
  tenantId: string,
  branchId: string,
  tableId: string
): Promise<MenuDto[]> => {
  const table = await findTableQrEntry(prisma, {
    tenantId,
    branchId,
    tableId
  });

  if (!table) {
    throw new AppError(ErrorCode.TableNotFound);
  }

  const menus = await listActiveMenusByTenant(prisma, tenantId);

  return menus.map(toMenuDto);
};
