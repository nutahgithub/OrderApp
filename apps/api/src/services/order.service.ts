import { Prisma } from "@prisma/client";
import type { OrderItem } from "@prisma/client";
import { findBranchByTenant } from "../repositories/branch.repository.js";
import { listActiveMenusByTenantAndIds } from "../repositories/menu.repository.js";
import {
  countOrdersByTenantBranch,
  createOrderWithItems,
  findOrderByTenant,
  listOrdersByTenantBranch,
  updateOrderStatusByTenant
} from "../repositories/order.repository.js";
import type { OrderRecord } from "../repositories/order.repository.js";
import { findTableQrEntry } from "../repositories/table.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import { emitOrderCreated, emitOrderStatusUpdated } from "../shared/realtime/socket.js";
import type {
  CreateQrOrderInput,
  ListOrdersInput,
  ListOrdersResultDto,
  OrderDetailDto,
  OrderDto,
  OrderItemDto,
  UpdateOrderStatusInput
} from "../types/order.types.js";

const toMoney = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const startOfUtcDay = (dateOnlyValue: string): Date => {
  return new Date(`${dateOnlyValue}T00:00:00.000Z`);
};

const addUtcDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const resolveOrderDateRange = (input: ListOrdersInput): { startDate?: Date; endDateExclusive?: Date } => {
  if (!input.startDate && !input.endDate) {
    return {};
  }

  const startDateValue = input.startDate ?? input.endDate;
  const endDateValue = input.endDate ?? input.startDate;

  if (!startDateValue || !endDateValue) {
    return {};
  }

  return {
    startDate: startOfUtcDay(startDateValue),
    endDateExclusive: addUtcDays(startOfUtcDay(endDateValue), 1)
  };
};

const calculateLineTotal = (item: Pick<OrderItem, "quantity" | "unitPrice">): string => {
  return item.unitPrice.mul(new Prisma.Decimal(item.quantity)).toFixed(2);
};

export const toOrderDto = (order: OrderRecord): OrderDto => {
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

export const toOrderDetailDto = (order: OrderRecord): OrderDetailDto => {
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

export const listTenantOrders = async (tenantId: string, input: ListOrdersInput): Promise<ListOrdersResultDto> => {
  await ensureBranchBelongsToTenant(tenantId, input.branchId);

  const dateRange = resolveOrderDateRange(input);
  const query = {
    tenantId,
    branchId: input.branchId,
    status: input.status,
    ...dateRange
  };
  const [orders, total] = await Promise.all([
    listOrdersByTenantBranch(prisma, {
      ...query,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    }),
    countOrdersByTenantBranch(prisma, query)
  ]);

  return {
    orders: orders.map(toOrderDto),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize))
    }
  };
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

export const createQrOrder = async (
  tenantId: string,
  branchId: string,
  tableId: string,
  input: CreateQrOrderInput
): Promise<OrderDetailDto> => {
  const order = await prisma.$transaction(async (tx) => {
    const table = await findTableQrEntry(tx, {
      tenantId,
      branchId,
      tableId
    });

    if (!table || table.status === "DISABLED") {
      throw new AppError(ErrorCode.TableNotFound);
    }

    const quantityByMenuId = input.items.reduce<Map<string, number>>((accumulator, item) => {
      accumulator.set(item.menuId, (accumulator.get(item.menuId) ?? 0) + item.quantity);
      return accumulator;
    }, new Map<string, number>());
    const menuIds = [...quantityByMenuId.keys()];
    const menus = await listActiveMenusByTenantAndIds(tx, {
      tenantId,
      menuIds
    });

    if (menus.length !== menuIds.length) {
      throw new AppError(ErrorCode.InvalidOrderCart);
    }

    const items = menus.map((menu) => ({
      menuId: menu.id,
      quantity: quantityByMenuId.get(menu.id) ?? 0,
      unitPrice: menu.price
    }));
    const total = items.reduce((sum, item) => {
      return sum.add(item.unitPrice.mul(new Prisma.Decimal(item.quantity)));
    }, new Prisma.Decimal(0));

    return createOrderWithItems(tx, {
      tenantId,
      branchId,
      tableId,
      total,
      items
    });
  });

  const dto = toOrderDetailDto(order);

  logger.info("order_created", {
    tenantId,
    branchId,
    tableId,
    orderId: dto.id
  });
  emitOrderCreated({
    order: toOrderDto(order)
  });

  return dto;
};

export const getQrOrderDetail = async (
  tenantId: string,
  branchId: string,
  tableId: string,
  orderId: string
): Promise<OrderDetailDto> => {
  const order = await findOrderByTenant(prisma, {
    tenantId,
    orderId
  });

  if (!order || order.branchId !== branchId || order.tableId !== tableId) {
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

  const dto = toOrderDetailDto(order);

  emitOrderStatusUpdated({
    order: dto
  });

  return dto;
};
