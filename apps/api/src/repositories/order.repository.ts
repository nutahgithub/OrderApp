import type { Menu, Order, OrderItem, Prisma } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type OrderSummaryRecord = Order & {
  branch: {
    id: string;
    name: string;
  };
  table: {
    id: string;
    name: string;
  };
  items: Array<
    OrderItem & {
      menu: Pick<Menu, "id" | "name">;
    }
  >;
};

export const findActiveMenusByIds = async (
  db: DbClient,
  input: {
    tenantId: string;
    menuIds: string[];
  }
): Promise<Menu[]> => {
  return db.menu.findMany({
    where: {
      tenantId: input.tenantId,
      id: {
        in: input.menuIds
      },
      isActive: true
    }
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
): Promise<OrderSummaryRecord> => {
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
    include: {
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
          createdAt: "asc"
        }
      }
    }
  });
};

export const findOrderSummaryByQrContext = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    tableId: string;
    orderId: string;
  }
): Promise<OrderSummaryRecord | null> => {
  return db.order.findFirst({
    where: {
      id: input.orderId,
      tenantId: input.tenantId,
      branchId: input.branchId,
      tableId: input.tableId
    },
    include: {
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
          createdAt: "asc"
        }
      }
    }
  });
};
