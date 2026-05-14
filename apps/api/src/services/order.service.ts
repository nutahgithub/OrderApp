import { Prisma, TableStatus } from "@prisma/client";
import type { Menu } from "@prisma/client";
import { createOrderWithItems, findActiveMenusByIds, findOrderSummaryByQrContext } from "../repositories/order.repository.js";
import type { OrderSummaryRecord } from "../repositories/order.repository.js";
import { findTableQrEntry } from "../repositories/table.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { CreateCustomerOrderInput, OrderSummaryDto } from "../types/order.types.js";

type ConsolidatedItem = {
  menuId: string;
  quantity: number;
};

const money = (value: Prisma.Decimal): string => value.toFixed(2);

const toOrderSummaryDto = (order: OrderSummaryRecord): OrderSummaryDto => ({
  id: order.id,
  tenantId: order.tenantId,
  branchId: order.branchId,
  tableId: order.tableId,
  status: order.status,
  total: money(order.total),
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
  branch: order.branch,
  table: order.table,
  items: order.items.map((item) => ({
    id: item.id,
    menuId: item.menuId,
    name: item.menu.name,
    quantity: item.quantity,
    unitPrice: money(item.unitPrice),
    lineTotal: money(item.unitPrice.mul(item.quantity))
  }))
});

const consolidateItems = (items: CreateCustomerOrderInput["items"]): ConsolidatedItem[] => {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.menuId, (quantities.get(item.menuId) ?? 0) + item.quantity);
  }

  return Array.from(quantities.entries()).map(([menuId, quantity]) => ({
    menuId,
    quantity
  }));
};

const getMenuMap = (menus: Menu[]): Map<string, Menu> => {
  return new Map(menus.map((menu) => [menu.id, menu]));
};

export const createCustomerOrder = async (
  tenantId: string,
  branchId: string,
  tableId: string,
  input: CreateCustomerOrderInput
): Promise<OrderSummaryDto> => {
  const order = await prisma.$transaction(async (tx) => {
    const table = await findTableQrEntry(tx, {
      tenantId,
      branchId,
      tableId
    });

    if (!table) {
      throw new AppError(ErrorCode.TableNotFound);
    }

    if (table.status === TableStatus.DISABLED) {
      throw new AppError(ErrorCode.TableUnavailable);
    }

    const items = consolidateItems(input.items);
    const menuIds = items.map((item) => item.menuId);
    const menus = await findActiveMenusByIds(tx, {
      tenantId,
      menuIds
    });

    if (menus.length !== menuIds.length) {
      throw new AppError(ErrorCode.MenuNotFound);
    }

    const menuMap = getMenuMap(menus);
    const orderItems = items.map((item) => {
      const menu = menuMap.get(item.menuId);

      if (!menu) {
        throw new AppError(ErrorCode.MenuNotFound);
      }

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        unitPrice: menu.price
      };
    });
    const total = orderItems.reduce(
      (sum, item) => sum.add(item.unitPrice.mul(item.quantity)),
      new Prisma.Decimal("0")
    );

    return createOrderWithItems(tx, {
      tenantId,
      branchId,
      tableId,
      total,
      items: orderItems
    });
  });

  logger.info("customer_order_created", {
    tenantId,
    branchId,
    tableId,
    orderId: order.id,
    total: order.total.toFixed(2)
  });

  return toOrderSummaryDto(order);
};

export const getCustomerOrderSummary = async (
  tenantId: string,
  branchId: string,
  tableId: string,
  orderId: string
): Promise<OrderSummaryDto> => {
  const order = await findOrderSummaryByQrContext(prisma, {
    tenantId,
    branchId,
    tableId,
    orderId
  });

  if (!order) {
    throw new AppError(ErrorCode.OrderNotFound);
  }

  return toOrderSummaryDto(order);
};
