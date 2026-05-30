import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../shared/prisma/types.js";
import {
  countOrdersByTenantBranch,
  findOrderByTenant,
  listOrdersByTenantBranch,
  replaceOrderItemsByTenant,
  updateOrderStatusByTenant
} from "../order.repository.js";
import { createCompletedPayment, findPaymentByTenantOrder } from "../payment.repository.js";
import {
  countOrders,
  countProcessingOrders,
  groupOrdersByStatus,
  listTopMenuItems,
  sumCompletedRevenue
} from "../report.repository.js";
import { findTableQrEntry, listTablesByTenantBranch, updateTableByTenant } from "../table.repository.js";

const createDb = () => {
  const db = {
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
      create: vi.fn()
    },
    orderItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([])
    },
    payment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({
        _sum: {
          amount: null
        }
      })
    },
    restaurantTable: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 })
    },
    menu: {
      findMany: vi.fn().mockResolvedValue([])
    }
  };

  return db as typeof db & DbClient;
};

describe("tenant isolation repository queries", () => {
  it("scopes admin order reads and writes by tenant and branch/order identifiers", async () => {
    const db = createDb();
    const range = {
      startDate: new Date("2026-05-10T00:00:00.000Z"),
      endDateExclusive: new Date("2026-05-11T00:00:00.000Z")
    };

    await listOrdersByTenantBranch(db, {
      tenantId: "tenant-a",
      branchId: "branch-a",
      status: OrderStatus.PENDING,
      ...range,
      skip: 0,
      take: 20
    });
    await countOrdersByTenantBranch(db, {
      tenantId: "tenant-a",
      branchId: "branch-a",
      status: OrderStatus.PENDING,
      ...range
    });
    await findOrderByTenant(db, {
      tenantId: "tenant-a",
      orderId: "order-a"
    });
    await updateOrderStatusByTenant(db, {
      tenantId: "tenant-a",
      orderId: "order-a",
      status: OrderStatus.CONFIRMED
    });

    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-a",
          branchId: "branch-a",
          status: OrderStatus.PENDING,
          createdAt: {
            gte: range.startDate,
            lt: range.endDateExclusive
          }
        })
      })
    );
    expect(db.order.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-a",
          branchId: "branch-a"
        })
      })
    );
    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "order-a",
          tenantId: "tenant-a"
        }
      })
    );
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: "order-a",
        tenantId: "tenant-a"
      },
      data: {
        status: OrderStatus.CONFIRMED
      }
    });
  });

  it("scopes public table QR lookups and table updates by tenant, branch, and table", async () => {
    const db = createDb();

    await listTablesByTenantBranch(db, {
      tenantId: "tenant-a",
      branchId: "branch-a"
    });
    await findTableQrEntry(db, {
      tenantId: "tenant-a",
      branchId: "branch-a",
      tableId: "table-a"
    });
    await updateTableByTenant(db, {
      tenantId: "tenant-a",
      tableId: "table-a",
      name: "Table A",
      status: "AVAILABLE"
    });

    expect(db.restaurantTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-a",
          branchId: "branch-a"
        }
      })
    );
    expect(db.restaurantTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "table-a",
          tenantId: "tenant-a",
          branchId: "branch-a"
        }
      })
    );
    expect(db.restaurantTable.updateMany).toHaveBeenCalledWith({
      where: {
        id: "table-a",
        tenantId: "tenant-a"
      },
      data: {
        name: "Table A",
        status: "AVAILABLE"
      }
    });
  });

  it("scopes payment reads and writes by tenant and order or branch", async () => {
    const db = createDb();
    const amount = new Prisma.Decimal("90000.00");

    await findPaymentByTenantOrder(db, {
      tenantId: "tenant-a",
      orderId: "order-a"
    });
    await createCompletedPayment(db, {
      tenantId: "tenant-a",
      branchId: "branch-a",
      orderId: "order-a",
      method: PaymentMethod.CASH,
      amount
    });

    expect(db.payment.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-a",
        orderId: "order-a"
      }
    });
    expect(db.payment.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-a",
        branchId: "branch-a",
        orderId: "order-a",
        method: PaymentMethod.CASH,
        amount,
        status: "COMPLETED"
      }
    });
  });

  it("scopes report revenue, order counts, status groups, and top menu queries by tenant", async () => {
    const db = createDb();
    const filters = {
      tenantId: "tenant-a",
      branchId: "branch-a",
      startDate: new Date("2026-05-10T00:00:00.000Z"),
      endDateExclusive: new Date("2026-05-11T00:00:00.000Z")
    };

    await sumCompletedRevenue(db, filters);
    await countOrders(db, filters);
    await countProcessingOrders(db, filters);
    await groupOrdersByStatus(db, filters);
    await listTopMenuItems(db, filters, 5);

    const expectedOrderWhere = {
      tenantId: "tenant-a",
      branchId: "branch-a",
      createdAt: {
        gte: filters.startDate,
        lt: filters.endDateExclusive
      }
    };
    const expectedPaymentWhere = {
      tenantId: "tenant-a",
      branchId: "branch-a",
      paidAt: {
        gte: filters.startDate,
        lt: filters.endDateExclusive
      }
    };

    expect(db.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPaymentWhere
      })
    );
    expect(db.order.count).toHaveBeenCalledWith({
      where: expectedOrderWhere
    });
    expect(db.order.count).toHaveBeenCalledWith({
      where: {
        ...expectedOrderWhere,
        status: {
          in: ["PENDING", "CONFIRMED", "PREPARING", "READY"]
        }
      }
    });
    expect(db.order.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedOrderWhere
      })
    );
    expect(db.orderItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          order: {
            ...expectedOrderWhere,
            status: {
              not: "CANCELLED"
            }
          }
        }
      })
    );
  });

  it("does not replace items when the target order is outside the tenant", async () => {
    const db = createDb();

    const result = await replaceOrderItemsByTenant(db, {
      tenantId: "tenant-a",
      orderId: "order-from-tenant-b",
      total: new Prisma.Decimal("90000.00"),
      items: [
        {
          menuId: "menu-a",
          quantity: 1,
          unitPrice: new Prisma.Decimal("90000.00")
        }
      ]
    });

    expect(result).toBeNull();
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: "order-from-tenant-b",
        tenantId: "tenant-a"
      },
      data: {
        total: new Prisma.Decimal("90000.00")
      }
    });
    expect(db.orderItem.deleteMany).not.toHaveBeenCalled();
    expect(db.orderItem.createMany).not.toHaveBeenCalled();
  });
});
