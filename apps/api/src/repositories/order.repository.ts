import type { Branch, Menu, Order, OrderItem, OrderStatus, Prisma, RestaurantTable } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type OrderRecord = Order & {
  branch: Pick<Branch, "id" | "name">;
  table: Pick<RestaurantTable, "id" | "name">;
  items: Array<
    OrderItem & {
      menu: Pick<Menu, "id" | "name">;
    }
  >;
};

const orderInclude = {
  branch: {
    select: {
      id: true,
      name: true
    }
  },
  table: {
    select: {
      id: true,
      name: true
    }
  },
  items: {
    include: {
      menu: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
};

export const listOrdersByTenantBranch = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    status?: OrderStatus;
  }
): Promise<OrderRecord[]> => {
  return db.order.findMany({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      ...(input.status ? { status: input.status } : {})
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const findOrderByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    orderId: string;
  }
): Promise<OrderRecord | null> => {
  return db.order.findFirst({
    where: {
      id: input.orderId,
      tenantId: input.tenantId
    },
    include: orderInclude
  });
};

export const updateOrderStatusByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    orderId: string;
    status: OrderStatus;
  }
): Promise<OrderRecord | null> => {
  const result = await db.order.updateMany({
    where: {
      id: input.orderId,
      tenantId: input.tenantId
    },
    data: {
      status: input.status
    }
  });

  if (result.count === 0) {
    return null;
  }

  return findOrderByTenant(db, {
    tenantId: input.tenantId,
    orderId: input.orderId
  });
};

export const createOrderWithItems = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    tableId: string;
    total: Prisma.Decimal;
    items: Array<{
      menuId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }>;
  }
): Promise<OrderRecord> => {
  return db.order.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      tableId: input.tableId,
      total: input.total,
      items: {
        create: input.items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }
    },
    include: orderInclude
  });
};
