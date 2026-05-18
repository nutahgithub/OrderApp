import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";
import type { ReportQueryFilters } from "../types/report.types.js";

const orderWhere = (filters: ReportQueryFilters) => ({
  tenantId: filters.tenantId,
  createdAt: {
    gte: filters.startDate,
    lt: filters.endDateExclusive
  },
  ...(filters.branchId ? { branchId: filters.branchId } : {})
});

const paymentWhere = (filters: ReportQueryFilters) => ({
  tenantId: filters.tenantId,
  paidAt: {
    gte: filters.startDate,
    lt: filters.endDateExclusive
  },
  ...(filters.branchId ? { branchId: filters.branchId } : {})
});

export const sumCompletedRevenue = async (db: DbClient, filters: ReportQueryFilters): Promise<Prisma.Decimal> => {
  const result = await db.payment.aggregate({
    where: paymentWhere(filters),
    _sum: {
      amount: true
    }
  });

  return result._sum.amount ?? new Prisma.Decimal(0);
};

export const countOrders = async (db: DbClient, filters: ReportQueryFilters): Promise<number> => {
  return db.order.count({
    where: orderWhere(filters)
  });
};

export const countProcessingOrders = async (db: DbClient, filters: ReportQueryFilters): Promise<number> => {
  return db.order.count({
    where: {
      ...orderWhere(filters),
      status: {
        in: ["PENDING", "CONFIRMED", "PREPARING", "READY"]
      }
    }
  });
};

export const groupOrdersByStatus = async (
  db: DbClient,
  filters: ReportQueryFilters
): Promise<Array<{ status: OrderStatus; count: number }>> => {
  const results = await db.order.groupBy({
    by: ["status"],
    where: orderWhere(filters),
    _count: {
      _all: true
    }
  });

  return results.map((result) => ({
    status: result.status,
    count: result._count._all
  }));
};

export const listTopMenuItems = async (
  db: DbClient,
  filters: ReportQueryFilters,
  limit: number
): Promise<
  Array<{
    menuId: string;
    menuName: string;
    quantity: number;
    revenue: Prisma.Decimal;
  }>
> => {
  const groupedItems = await db.orderItem.groupBy({
    by: ["menuId"],
    where: {
      order: {
        ...orderWhere(filters),
        status: {
          not: "CANCELLED"
        }
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: "desc"
      }
    },
    take: limit
  });

  if (groupedItems.length === 0) {
    return [];
  }

  const menuIds = groupedItems.map((item) => item.menuId);
  const menus = await db.menu.findMany({
    where: {
      tenantId: filters.tenantId,
      id: {
        in: menuIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const menuNameById = new Map(menus.map((menu) => [menu.id, menu.name]));

  const revenueRows = await db.orderItem.findMany({
    where: {
      menuId: {
        in: menuIds
      },
      order: {
        ...orderWhere(filters),
        status: {
          not: "CANCELLED"
        }
      }
    },
    select: {
      menuId: true,
      quantity: true,
      unitPrice: true
    }
  });

  const revenueByMenuId = revenueRows.reduce<Map<string, Prisma.Decimal>>((accumulator, item) => {
    const current = accumulator.get(item.menuId) ?? new Prisma.Decimal(0);
    accumulator.set(item.menuId, current.add(item.unitPrice.mul(item.quantity)));
    return accumulator;
  }, new Map<string, Prisma.Decimal>());

  return groupedItems.map((item) => ({
    menuId: item.menuId,
    menuName: menuNameById.get(item.menuId) ?? item.menuId,
    quantity: item._sum.quantity ?? 0,
    revenue: revenueByMenuId.get(item.menuId) ?? new Prisma.Decimal(0)
  }));
};
