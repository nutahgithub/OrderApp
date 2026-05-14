import type { Branch, Menu, Order, OrderItem, RestaurantTable } from "@prisma/client";
import { OrderStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBranchByTenant } from "../../repositories/branch.repository.js";
import {
  findOrderByTenant,
  listOrdersByTenantBranch,
  updateOrderStatusByTenant
} from "../../repositories/order.repository.js";
import type { OrderRecord } from "../../repositories/order.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { getTenantOrderDetail, listTenantOrders, updateTenantOrderStatus } from "../order.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    branch: {},
    order: {}
  }
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  findBranchByTenant: vi.fn()
}));

vi.mock("../../repositories/order.repository.js", () => ({
  findOrderByTenant: vi.fn(),
  listOrdersByTenantBranch: vi.fn(),
  updateOrderStatusByTenant: vi.fn()
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
  status: "AVAILABLE",
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
  createdAt: new Date("2026-05-13T10:01:00.000Z"),
  ...overrides
});

const orderFixture = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  tableId: "table-1",
  status: OrderStatus.PENDING,
  total: new Prisma.Decimal("90000.00"),
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const orderRecordFixture = (overrides: Partial<OrderRecord> = {}): OrderRecord => {
  const table = tableFixture();
  const branch = branchFixture();
  const menu = menuFixture();

  return {
    ...orderFixture(),
    branch: {
      id: branch.id,
      name: branch.name
    },
    table: {
      id: table.id,
      name: table.name
    },
    items: [
      {
        ...orderItemFixture(),
        menu: {
          id: menu.id,
          name: menu.name
        }
      }
    ],
    ...overrides
  };
};

describe("order service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists orders for a branch inside the tenant scope", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(listOrdersByTenantBranch).mockResolvedValue([orderRecordFixture()]);

    const result = await listTenantOrders("tenant-1", {
      branchId: "branch-1",
      status: OrderStatus.PENDING
    });

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1"
    });
    expect(listOrdersByTenantBranch).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      status: OrderStatus.PENDING
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: "order-1",
        branchName: "Main Branch",
        tableName: "Table 1",
        total: "90000.00",
        itemCount: 2
      })
    ]);
  });

  it("rejects listing orders for a branch outside the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    await expect(listTenantOrders("tenant-1", { branchId: "branch-2" })).rejects.toMatchObject({
      code: ErrorCode.BranchNotFound
    });
    expect(listOrdersByTenantBranch).not.toHaveBeenCalled();
  });

  it("returns order detail with item line totals", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(orderRecordFixture());

    const result = await getTenantOrderDetail("tenant-1", "order-1");

    expect(findOrderByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      orderId: "order-1"
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        menuName: "Pho",
        unitPrice: "45000.00",
        lineTotal: "90000.00"
      })
    ]);
  });

  it("updates order status inside the tenant scope", async () => {
    vi.mocked(updateOrderStatusByTenant).mockResolvedValue(
      orderRecordFixture({
        status: OrderStatus.CONFIRMED
      })
    );

    const result = await updateTenantOrderStatus("tenant-1", "order-1", {
      status: "CONFIRMED"
    });

    expect(updateOrderStatusByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      orderId: "order-1",
      status: "CONFIRMED"
    });
    expect(result.status).toBe(OrderStatus.CONFIRMED);
  });

  it("returns ORDER_NOT_FOUND when updating an order outside the tenant", async () => {
    vi.mocked(updateOrderStatusByTenant).mockResolvedValue(null);

    await expect(
      updateTenantOrderStatus("tenant-1", "missing-order", {
        status: "CANCELLED"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.OrderNotFound
    });
  });
});
