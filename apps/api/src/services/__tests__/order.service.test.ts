import type { Branch, Menu, Order, OrderItem, RestaurantTable } from "@prisma/client";
import { OrderStatus, Prisma, TableStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderWithItems, findActiveMenusByIds, findOrderSummaryByQrContext } from "../../repositories/order.repository.js";
import type { OrderSummaryRecord } from "../../repositories/order.repository.js";
import { findTableQrEntry } from "../../repositories/table.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { createCustomerOrder, getCustomerOrderSummary } from "../order.service.js";

type TransactionCallback = (tx: Record<string, never>) => Promise<OrderSummaryRecord>;

const transactionClient = {};

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn((callback: TransactionCallback) => callback(transactionClient)),
    order: {}
  }
}));

vi.mock("../../repositories/order.repository.js", () => ({
  createOrderWithItems: vi.fn(),
  findActiveMenusByIds: vi.fn(),
  findOrderSummaryByQrContext: vi.fn()
}));

vi.mock("../../repositories/table.repository.js", () => ({
  findTableQrEntry: vi.fn()
}));

const branchFixture = (overrides: Partial<Branch> = {}): Branch => ({
  id: "branch-1",
  tenantId: "tenant-1",
  name: "Main Branch",
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const tableFixture = (overrides: Partial<RestaurantTable> = {}): RestaurantTable => ({
  id: "table-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  name: "Table 1",
  status: TableStatus.AVAILABLE,
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const menuFixture = (overrides: Partial<Menu> = {}): Menu => ({
  id: "menu-1",
  tenantId: "tenant-1",
  name: "Pho",
  price: new Prisma.Decimal("45000.00"),
  imageUrl: null,
  isActive: true,
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const orderItemFixture = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "order-item-1",
  orderId: "order-1",
  menuId: "menu-1",
  quantity: 2,
  unitPrice: new Prisma.Decimal("45000.00"),
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const orderFixture = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  tableId: "table-1",
  status: OrderStatus.PENDING,
  total: new Prisma.Decimal("110000.00"),
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const orderSummaryFixture = (): OrderSummaryRecord => ({
  ...orderFixture(),
  branch: {
    id: "branch-1",
    name: "Main Branch"
  },
  table: {
    id: "table-1",
    name: "Table 1"
  },
  items: [
    {
      ...orderItemFixture(),
      menu: {
        id: "menu-1",
        name: "Pho"
      }
    },
    {
      ...orderItemFixture({
        id: "order-item-2",
        menuId: "menu-2",
        quantity: 1,
        unitPrice: new Prisma.Decimal("20000.00")
      }),
      menu: {
        id: "menu-2",
        name: "Tea"
      }
    }
  ]
});

describe("order service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a customer order in a transaction and calculates total from active menu prices", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue({
      ...tableFixture(),
      branch: {
        id: "branch-1",
        name: "Main Branch"
      }
    });
    vi.mocked(findActiveMenusByIds).mockResolvedValue([
      menuFixture(),
      menuFixture({
        id: "menu-2",
        name: "Tea",
        price: new Prisma.Decimal("20000.00")
      })
    ]);
    vi.mocked(createOrderWithItems).mockResolvedValue(orderSummaryFixture());

    const result = await createCustomerOrder("tenant-1", "branch-1", "table-1", {
      items: [
        {
          menuId: "menu-1",
          quantity: 2
        },
        {
          menuId: "menu-2",
          quantity: 1
        }
      ]
    });

    expect(findTableQrEntry).toHaveBeenCalledWith(transactionClient, {
      tenantId: "tenant-1",
      branchId: "branch-1",
      tableId: "table-1"
    });
    expect(createOrderWithItems).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        tenantId: "tenant-1",
        branchId: "branch-1",
        tableId: "table-1",
        total: new Prisma.Decimal("110000.00")
      })
    );
    expect(result.total).toBe("110000.00");
    expect(result.items[0]?.lineTotal).toBe("90000.00");
  });

  it("rejects orders for an invalid tenant branch table context", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue(null);

    await expect(
      createCustomerOrder("tenant-1", "branch-1", "missing-table", {
        items: [
          {
            menuId: "menu-1",
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      code: ErrorCode.TableNotFound
    });
    expect(findActiveMenusByIds).not.toHaveBeenCalled();
    expect(createOrderWithItems).not.toHaveBeenCalled();
  });

  it("rejects orders when the QR table is disabled", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue({
      ...tableFixture({ status: TableStatus.DISABLED }),
      branch: {
        id: "branch-1",
        name: "Main Branch"
      }
    });

    await expect(
      createCustomerOrder("tenant-1", "branch-1", "table-1", {
        items: [
          {
            menuId: "menu-1",
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      code: ErrorCode.TableUnavailable
    });
    expect(createOrderWithItems).not.toHaveBeenCalled();
  });

  it("rejects orders when any menu item is inactive or outside the tenant", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue({
      ...tableFixture(),
      branch: {
        id: "branch-1",
        name: "Main Branch"
      }
    });
    vi.mocked(findActiveMenusByIds).mockResolvedValue([menuFixture()]);

    await expect(
      createCustomerOrder("tenant-1", "branch-1", "table-1", {
        items: [
          {
            menuId: "menu-1",
            quantity: 1
          },
          {
            menuId: "other-tenant-menu",
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      code: ErrorCode.MenuNotFound
    });
    expect(createOrderWithItems).not.toHaveBeenCalled();
  });

  it("loads order summary only inside the QR context", async () => {
    vi.mocked(findOrderSummaryByQrContext).mockResolvedValue(orderSummaryFixture());

    const result = await getCustomerOrderSummary("tenant-1", "branch-1", "table-1", "order-1");

    expect(findOrderSummaryByQrContext).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      tableId: "table-1",
      orderId: "order-1"
    });
    expect(result.id).toBe("order-1");
  });

  it("returns ORDER_NOT_FOUND for a summary outside the tenant or table context", async () => {
    vi.mocked(findOrderSummaryByQrContext).mockResolvedValue(null);

    await expect(getCustomerOrderSummary("tenant-1", "branch-1", "table-1", "order-2")).rejects.toMatchObject({
      code: ErrorCode.OrderNotFound
    });
  });
});
