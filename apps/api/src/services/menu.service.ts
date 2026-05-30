import { Prisma } from "@prisma/client";
import type { Menu } from "@prisma/client";
import { findTableQrEntry } from "../repositories/table.repository.js";
import {
  countMenuOrderItemsByTenant,
  createMenu,
  deleteMenuByTenant,
  listActiveMenusByTenant,
  listMenusByTenant,
  updateMenuByTenant
} from "../repositories/menu.repository.js";
import type { MenuWithUsage } from "../repositories/menu.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { CreateMenuInput, MenuDto, UpdateMenuInput } from "../types/menu.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const normalizePrice = (price: string): string => {
  return new Prisma.Decimal(price).toFixed(2);
};

const toMenuDto = (menu: Menu | MenuWithUsage): MenuDto => {
  return {
    id: menu.id,
    tenantId: menu.tenantId,
    name: menu.name,
    price: menu.price.toFixed(2),
    imageUrl: menu.imageUrl,
    isActive: menu.isActive,
    canDelete: "_count" in menu ? menu._count.items === 0 : false,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString()
  };
};

export const listTenantMenus = async (tenantId: string): Promise<MenuDto[]> => {
  const menus = await listMenusByTenant(prisma, tenantId);

  return menus.map(toMenuDto);
};

export const createTenantMenu = async (
  tenantId: string,
  input: CreateMenuInput,
  actorAdminId?: string
): Promise<MenuDto> => {
  const menu = await createMenu(prisma, {
    tenantId,
    name: input.name.trim(),
    price: normalizePrice(input.price),
    imageUrl: input.imageUrl ?? null,
    isActive: input.isActive
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
      isActive: menu.isActive
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
  const menu = await updateMenuByTenant(prisma, {
    tenantId,
    menuId,
    name: input.name.trim(),
    price: normalizePrice(input.price),
    imageUrl: input.imageUrl ?? null,
    isActive: input.isActive
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
      isActive: menu.isActive
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
