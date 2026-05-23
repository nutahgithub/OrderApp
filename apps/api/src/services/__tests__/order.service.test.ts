import type { Branch, Menu, Order, OrderItem, RestaurantTable } from "@prisma/client";
import { OrderStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBranchByTenant } from "../../repositories/branch.repository.js";
import {
  attachIdempotencyResource,
  createIdempotencyKey,
  findIdempotencyKey
} from "../../repositories/idempotency.repository.js";
import { listActiveMenusByTenantAndIds } from "../../repositories/menu.repository.js";
import {
  countOrdersByTenantBranch,
  createOrderWithItems,
  findOrderByTenant,
  listOrdersByTenantBranch,
  replaceOrderItemsByTenant,
  updateOrderStatusByTenant
} from "../../repositories/order.repository.js";
import type { OrderRecord } from "../../repositories/order.repository.js";
import { findTableQrEntry } from "../../repositories/table.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { hashIdempotencyPayload } from "../../shared/http/idempotency.js";
import { emitOrderCreated } from "../../shared/realtime/socket.js";
import { createQrOrder, getTenantOrderDetail, listTenantOrders, updateTenantOrderItems, updateTenantOrderStatus } from "../order.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    branch: {},
    order: {},
    $transaction: vi.fn((callback: (tx: object) => unknown) => callback({}))
  }
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  findBranchByTenant: vi.fn()
}));

vi.mock("../../repositories/menu.repository.js", () => ({
  listActiveMenusByTenantAndIds: vi.fn()
}));

vi.mock("../../repositories/idempotency.repository.js", () => ({
  attachIdempotencyResource: vi.fn(),
  createIdempotencyKey: vi.fn(),
  findIdempotencyKey: vi.fn()
}));

vi.mock("../../repositories/order.repository.js", () => ({
  countOrdersByTenantBranch: vi.fn(),
  createOrderWithItems: vi.fn(),
  findOrderByTenant: vi.fn(),
  listOrdersByTenantBranch: vi.fn(),
  replaceOrderItemsByTenant: vi.fn(),
  updateOrderStatusByTenant: vi.fn()
}));

vi.mock("../../repositories/table.repository.js", () => ({
  findTableQrEntry: vi.fn()
}));

vi.mock("../../shared/realtime/socket.js", () => ({
  emitOrderCreated: vi.fn(),
  emitOrderStatusUpdated: vi.fn()
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
    vi.mocked(createIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CREATE_QR_ORDER",
      key: "order-key-1",
      requestHash: "hash",
      resourceId: null,
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });
  });

  it("lists orders for a branch inside the tenant scope", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(listOrdersByTenantBranch).mockResolvedValue([orderRecordFixture()]);
    vi.mocked(countOrdersByTenantBranch).mockResolvedValue(1);

    const result = await listTenantOrders("tenant-1", {
      branchId: "branch-1",
      status: OrderStatus.PENDING,
      startDate: "2026-05-13",
      endDate: "2026-05-13",
      page: 1,
      pageSize: 10
    });

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1"
    });
    expect(listOrdersByTenantBranch).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      status: OrderStatus.PENDING,
      startDate: new Date("2026-05-13T00:00:00.000Z"),
      endDateExclusive: new Date("2026-05-14T00:00:00.000Z"),
      skip: 0,
      take: 10
    });
    expect(countOrdersByTenantBranch).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      status: OrderStatus.PENDING,
      startDate: new Date("2026-05-13T00:00:00.000Z"),
      endDateExclusive: new Date("2026-05-14T00:00:00.000Z")
    });
    expect(result).toEqual({
      orders: [
      expect.objectContaining({
        id: "order-1",
        branchName: "Main Branch",
        tableName: "Table 1",
        total: "90000.00",
        itemCount: 2
      })
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1
      }
    });
  });

  it("rejects listing orders for a branch outside the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    await expect(
      listTenantOrders("tenant-1", { branchId: "branch-2", page: 1, pageSize: 10 })
    ).rejects.toMatchObject({
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

  it("updates editable order items and recalculates the total", async () => {
    const updatedRecord = orderRecordFixture({
      total: new Prisma.Decimal("135000.00"),
      items: [
        {
          ...orderItemFixture({
            quantity: 3
          }),
          menu: {
            id: "menu-1",
            name: "Pho"
          }
        }
      ]
    });

    vi.mocked(findOrderByTenant).mockResolvedValue(orderRecordFixture());
    vi.mocked(listActiveMenusByTenantAndIds).mockResolvedValue([menuFixture()]);
    vi.mocked(replaceOrderItemsByTenant).mockResolvedValue(updatedRecord);

    const result = await updateTenantOrderItems("tenant-1", "order-1", {
      items: [{ menuId: "menu-1", quantity: 3 }]
    });

    expect(listActiveMenusByTenantAndIds).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      menuIds: ["menu-1"]
    });
    expect(replaceOrderItemsByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      orderId: "order-1",
      total: new Prisma.Decimal("135000.00"),
      items: [
        {
          menuId: "menu-1",
          quantity: 3,
          unitPrice: new Prisma.Decimal("45000.00")
        }
      ]
    });
    expect(result.total).toBe("135000.00");
    expect(result.items[0]?.quantity).toBe(3);
  });

  it("blocks item edits after an order is paid", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(
      orderRecordFixture({
        status: OrderStatus.PAID
      })
    );

    await expect(
      updateTenantOrderItems("tenant-1", "order-1", {
        items: [{ menuId: "menu-1", quantity: 1 }]
      })
    ).rejects.toMatchObject({
      code: ErrorCode.OrderCannotBeEdited
    });
    expect(replaceOrderItemsByTenant).not.toHaveBeenCalled();
  });

  it("creates a QR order once for a new idempotency key", async () => {
    const createdOrder = orderRecordFixture();
    vi.mocked(findIdempotencyKey).mockResolvedValue(null);
    vi.mocked(findTableQrEntry).mockResolvedValue({
      ...tableFixture(),
      branch: {
        id: "branch-1",
        name: "Main Branch"
      }
    });
    vi.mocked(listActiveMenusByTenantAndIds).mockResolvedValue([menuFixture()]);
    vi.mocked(createOrderWithItems).mockResolvedValue(createdOrder);

    const result = await createQrOrder(
      "tenant-1",
      "branch-1",
      "table-1",
      {
        items: [{ menuId: "menu-1", quantity: 2 }]
      },
      "order-key-1"
    );

    expect(createIdempotencyKey).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      action: "CREATE_QR_ORDER",
      key: "order-key-1",
      requestHash: expect.any(String)
    });
    expect(createOrderWithItems).toHaveBeenCalledTimes(1);
    expect(attachIdempotencyResource).toHaveBeenCalledWith(expect.any(Object), {
      id: "idem-1",
      resourceId: "order-1"
    });
    expect(result.id).toBe("order-1");
    expect(emitOrderCreated).toHaveBeenCalledTimes(1);
  });

  it("returns the existing QR order when retrying with the same idempotency key and payload", async () => {
    const requestHash = hashIdempotencyPayload({
      branchId: "branch-1",
      tableId: "table-1",
      items: [{ menuId: "menu-1", quantity: 2 }]
    });
    vi.mocked(findIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CREATE_QR_ORDER",
      key: "order-key-1",
      requestHash,
      resourceId: "order-1",
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });
    vi.mocked(findOrderByTenant).mockResolvedValue(orderRecordFixture());

    const result = await createQrOrder(
      "tenant-1",
      "branch-1",
      "table-1",
      {
        items: [{ menuId: "menu-1", quantity: 2 }]
      },
      "order-key-1"
    );

    const firstCall = vi.mocked(findIdempotencyKey).mock.calls[0]?.[1];
    expect(firstCall).toEqual({
      tenantId: "tenant-1",
      action: "CREATE_QR_ORDER",
      key: "order-key-1"
    });
    expect(createOrderWithItems).not.toHaveBeenCalled();
    expect(emitOrderCreated).not.toHaveBeenCalled();
    expect(result.id).toBe("order-1");
  });

  it("rejects a reused QR order idempotency key with a different payload", async () => {
    vi.mocked(findIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CREATE_QR_ORDER",
      key: "order-key-1",
      requestHash: "different-hash",
      resourceId: "order-1",
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });

    await expect(
      createQrOrder(
        "tenant-1",
        "branch-1",
        "table-1",
        {
          items: [{ menuId: "menu-1", quantity: 3 }]
        },
        "order-key-1"
      )
    ).rejects.toMatchObject({
      code: ErrorCode.IdempotencyKeyConflict
    });
    expect(createOrderWithItems).not.toHaveBeenCalled();
  });
});
