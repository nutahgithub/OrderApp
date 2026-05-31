import type { Branch, Menu, Order, OrderItem, Payment, RestaurantTable } from "@prisma/client";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachIdempotencyResource,
  createIdempotencyKey,
  findIdempotencyKey
} from "../../repositories/idempotency.repository.js";
import { findOrderByTenant, updateOrderStatusByTenant } from "../../repositories/order.repository.js";
import type { OrderRecord } from "../../repositories/order.repository.js";
import { createCompletedPayment, findPaymentByTenantOrder } from "../../repositories/payment.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { hashIdempotencyPayload } from "../../shared/http/idempotency.js";
import { prisma } from "../../shared/prisma/client.js";
import { emitPaymentCompleted } from "../../shared/realtime/socket.js";
import { confirmTenantOrderPayment } from "../payment.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn()
  }
}));

vi.mock("../../repositories/order.repository.js", () => ({
  createOrderWithItems: vi.fn(),
  findOrderByTenant: vi.fn(),
  listOrdersByTenantBranch: vi.fn(),
  updateOrderStatusByTenant: vi.fn()
}));

vi.mock("../../repositories/idempotency.repository.js", () => ({
  attachIdempotencyResource: vi.fn(),
  createIdempotencyKey: vi.fn(),
  findIdempotencyKey: vi.fn()
}));

vi.mock("../../repositories/payment.repository.js", () => ({
  createCompletedPayment: vi.fn(),
  findPaymentByTenantOrder: vi.fn()
}));

vi.mock("../../shared/realtime/socket.js", () => ({
  emitOrderCreated: vi.fn(),
  emitOrderStatusUpdated: vi.fn(),
  emitPaymentCompleted: vi.fn()
}));

vi.mock("../audit-log.service.js", () => ({
  recordAuditLog: vi.fn()
}));

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

const branchFixture = (overrides: Partial<Branch> = {}): Branch => ({
  id: "branch-1",
  tenantId: "tenant-1",
  name: "Main Branch",
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const menuFixture = (overrides: Partial<Menu> = {}): Menu => ({
  id: "menu-1",
  tenantId: "tenant-1",
  categoryId: null,
  name: "Pho",
  price: new Prisma.Decimal("45000.00"),
  imageUrl: null,
  isActive: true,
  isOutOfStock: false,
  isFeatured: false,
  isNew: false,
  sortOrder: 0,
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
  status: OrderStatus.SERVED,
  total: new Prisma.Decimal("90000.00"),
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const orderRecordFixture = (overrides: Partial<OrderRecord> = {}): OrderRecord => {
  const branch = branchFixture();
  const table = tableFixture();
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

const paymentFixture = (overrides: Partial<Payment> = {}): Payment => ({
  id: "payment-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  orderId: "order-1",
  method: PaymentMethod.CASH,
  amount: new Prisma.Decimal("90000.00"),
  status: PaymentStatus.COMPLETED,
  paidAt: new Date("2026-05-13T10:05:00.000Z"),
  createdAt: new Date("2026-05-13T10:05:00.000Z"),
  updatedAt: new Date("2026-05-13T10:05:00.000Z"),
  ...overrides
});

describe("payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
    vi.mocked(findIdempotencyKey).mockResolvedValue(null);
    vi.mocked(createIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CONFIRM_PAYMENT",
      key: "payment-key-1",
      requestHash: "hash",
      resourceId: null,
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });
  });

  it("confirms payment, stores a payment record, marks order paid, and emits realtime", async () => {
    const servedOrder = orderRecordFixture();
    const paidOrder = orderRecordFixture({
      status: OrderStatus.PAID,
      updatedAt: new Date("2026-05-13T10:05:00.000Z")
    });
    vi.mocked(findOrderByTenant).mockResolvedValue(servedOrder);
    vi.mocked(findPaymentByTenantOrder).mockResolvedValue(null);
    vi.mocked(createCompletedPayment).mockResolvedValue(paymentFixture());
    vi.mocked(updateOrderStatusByTenant).mockResolvedValue(paidOrder);

    const result = await confirmTenantOrderPayment("tenant-1", "order-1", {
      amount: "90000.00",
      method: PaymentMethod.CASH
    }, "payment-key-1");

    expect(createCompletedPayment).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      orderId: "order-1",
      method: PaymentMethod.CASH,
      amount: new Prisma.Decimal("90000.00")
    });
    expect(updateOrderStatusByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      orderId: "order-1",
      status: OrderStatus.PAID
    });
    expect(attachIdempotencyResource).toHaveBeenCalledWith(expect.any(Object), {
      id: "idem-1",
      resourceId: "payment-1"
    });
    expect(result.order.status).toBe(OrderStatus.PAID);
    expect(result.payment.amount).toBe("90000.00");
    expect(emitPaymentCompleted).toHaveBeenCalledWith(result);
  });

  it("rejects duplicate payment when the order is already paid", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(
      orderRecordFixture({
        status: OrderStatus.PAID
      })
    );

    await expect(
      confirmTenantOrderPayment("tenant-1", "order-1", {
        amount: "90000.00",
        method: PaymentMethod.CASH
      }, "payment-key-1")
    ).rejects.toMatchObject({
      code: ErrorCode.OrderAlreadyPaid
    });
    expect(createCompletedPayment).not.toHaveBeenCalled();
  });

  it("rejects cancelled orders", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(
      orderRecordFixture({
        status: OrderStatus.CANCELLED
      })
    );

    await expect(
      confirmTenantOrderPayment("tenant-1", "order-1", {
        amount: "90000.00",
        method: PaymentMethod.CASH
      }, "payment-key-1")
    ).rejects.toMatchObject({
      code: ErrorCode.OrderCannotBePaid
    });
  });

  it("rejects a payment amount that does not match order total", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(orderRecordFixture());

    await expect(
      confirmTenantOrderPayment("tenant-1", "order-1", {
        amount: "80000.00",
        method: PaymentMethod.CASH
      }, "payment-key-1")
    ).rejects.toMatchObject({
      code: ErrorCode.PaymentAmountMismatch
    });
  });

  it("keeps tenant isolation by returning not found for an order outside the tenant", async () => {
    vi.mocked(findOrderByTenant).mockResolvedValue(null);

    await expect(
      confirmTenantOrderPayment("tenant-1", "order-from-other-tenant", {
        amount: "90000.00",
        method: PaymentMethod.CASH
      }, "payment-key-1")
    ).rejects.toMatchObject({
      code: ErrorCode.OrderNotFound
    });
    expect(findPaymentByTenantOrder).not.toHaveBeenCalled();
  });

  it("returns the existing payment when retrying with the same idempotency key and payload", async () => {
    const paidOrder = orderRecordFixture({
      status: OrderStatus.PAID,
      updatedAt: new Date("2026-05-13T10:05:00.000Z")
    });
    const payment = paymentFixture();
    const requestHash = hashIdempotencyPayload({
      orderId: "order-1",
      amount: "90000.00",
      method: PaymentMethod.CASH
    });
    vi.mocked(findIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CONFIRM_PAYMENT",
      key: "payment-key-1",
      requestHash,
      resourceId: "payment-1",
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });
    vi.mocked(findOrderByTenant).mockResolvedValue(paidOrder);
    vi.mocked(findPaymentByTenantOrder).mockResolvedValue(payment);

    const result = await confirmTenantOrderPayment(
      "tenant-1",
      "order-1",
      {
        amount: "90000.00",
        method: PaymentMethod.CASH
      },
      "payment-key-1"
    );

    expect(createCompletedPayment).not.toHaveBeenCalled();
    expect(updateOrderStatusByTenant).not.toHaveBeenCalled();
    expect(emitPaymentCompleted).not.toHaveBeenCalled();
    expect(result.payment.id).toBe("payment-1");
    expect(result.order.status).toBe(OrderStatus.PAID);
  });

  it("rejects a reused payment idempotency key with a different payload", async () => {
    vi.mocked(findIdempotencyKey).mockResolvedValue({
      id: "idem-1",
      tenantId: "tenant-1",
      action: "CONFIRM_PAYMENT",
      key: "payment-key-1",
      requestHash: "different-hash",
      resourceId: "payment-1",
      createdAt: new Date("2026-05-13T10:00:00.000Z"),
      updatedAt: new Date("2026-05-13T10:00:00.000Z")
    });

    await expect(
      confirmTenantOrderPayment(
        "tenant-1",
        "order-1",
        {
          amount: "80000.00",
          method: PaymentMethod.CASH
        },
        "payment-key-1"
      )
    ).rejects.toMatchObject({
      code: ErrorCode.IdempotencyKeyConflict
    });
    expect(createCompletedPayment).not.toHaveBeenCalled();
  });
});
