import { Prisma } from "@prisma/client";
import type { OrderItem } from "@prisma/client";
import { findBranchByTenant } from "../repositories/branch.repository.js";
import {
  findOrderByTenant,
  listOrdersByTenantBranch,
  updateOrderStatusByTenant
} from "../repositories/order.repository.js";
import type { OrderRecord } from "../repositories/order.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { ListOrdersInput, OrderDetailDto, OrderDto, OrderItemDto, UpdateOrderStatusInput } from "../types/order.types.js";

const toMoney = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const calculateLineTotal = (item: Pick<OrderItem, "quantity" | "unitPrice">): string => {
  return item.unitPrice.mul(new Prisma.Decimal(item.quantity)).toFixed(2);
};

const toOrderDto = (order: OrderRecord): OrderDto => {
  return {
    id: order.id,
    tenantId: order.tenantId,
    branchId: order.branchId,
    branchName: order.branch.name,
    tableId: order.tableId,
    tableName: order.table.name,
    status: order.status,
    total: toMoney(order.total),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
};

const toOrderItemDto = (item: OrderRecord["items"][number]): OrderItemDto => {
  return {
    id: item.id,
    menuId: item.menuId,
    menuName: item.menu.name,
    quantity: item.quantity,
    unitPrice: toMoney(item.unitPrice),
    lineTotal: calculateLineTotal(item),
    createdAt: item.createdAt.toISOString()
  };
};

const toOrderDetailDto = (order: OrderRecord): OrderDetailDto => {
  return {
    ...toOrderDto(order),
    items: order.items.map(toOrderItemDto)
  };
};

const ensureBranchBelongsToTenant = async (tenantId: string, branchId: string): Promise<void> => {
  const branch = await findBranchByTenant(prisma, {
    tenantId,
    branchId
  });

  if (!branch) {
    throw new AppError(ErrorCode.BranchNotFound);
  }
};

export const listTenantOrders = async (tenantId: string, input: ListOrdersInput): Promise<OrderDto[]> => {
  await ensureBranchBelongsToTenant(tenantId, input.branchId);

  const orders = await listOrdersByTenantBranch(prisma, {
    tenantId,
    branchId: input.branchId,
    status: input.status
  });

  return orders.map(toOrderDto);
};

export const getTenantOrderDetail = async (tenantId: string, orderId: string): Promise<OrderDetailDto> => {
  const order = await findOrderByTenant(prisma, {
    tenantId,
    orderId
  });

  if (!order) {
    throw new AppError(ErrorCode.OrderNotFound);
  }

  return toOrderDetailDto(order);
};

export const updateTenantOrderStatus = async (
  tenantId: string,
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<OrderDetailDto> => {
  const order = await updateOrderStatusByTenant(prisma, {
    tenantId,
    orderId,
    status: input.status
  });

  if (!order) {
    throw new AppError(ErrorCode.OrderNotFound);
  }

  logger.info("order_status_updated", {
    tenantId,
    branchId: order.branchId,
    orderId: order.id,
    status: order.status
  });

  return toOrderDetailDto(order);
};
