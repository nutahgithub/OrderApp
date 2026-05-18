import { OrderStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBranchByTenant } from "../../repositories/branch.repository.js";
import {
  countOrders,
  countProcessingOrders,
  groupOrdersByStatus,
  listTopMenuItems,
  sumCompletedRevenue
} from "../../repositories/report.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { prisma } from "../../shared/prisma/client.js";
import { getReportDashboard } from "../report.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {}
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  findBranchByTenant: vi.fn()
}));

vi.mock("../../repositories/report.repository.js", () => ({
  sumCompletedRevenue: vi.fn(),
  countOrders: vi.fn(),
  countProcessingOrders: vi.fn(),
  groupOrdersByStatus: vi.fn(),
  listTopMenuItems: vi.fn()
}));

describe("report service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findBranchByTenant).mockResolvedValue({
      id: "branch-1",
      tenantId: "tenant-1",
      name: "Main Branch",
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z")
    });
    vi.mocked(sumCompletedRevenue).mockResolvedValue(new Prisma.Decimal("125000.00"));
    vi.mocked(countOrders).mockResolvedValue(4);
    vi.mocked(countProcessingOrders).mockResolvedValue(2);
    vi.mocked(groupOrdersByStatus).mockResolvedValue([
      {
        status: OrderStatus.PENDING,
        count: 1
      },
      {
        status: OrderStatus.PAID,
        count: 3
      }
    ]);
    vi.mocked(listTopMenuItems).mockResolvedValue([
      {
        menuId: "menu-1",
        menuName: "Pho",
        quantity: 5,
        revenue: new Prisma.Decimal("225000.00")
      }
    ]);
  });

  it("passes tenant, branch, and inclusive date range filters to report queries", async () => {
    const result = await getReportDashboard("tenant-1", {
      branchId: "branch-1",
      startDate: "2026-05-10",
      endDate: "2026-05-12"
    });

    const expectedFilters = {
      tenantId: "tenant-1",
      branchId: "branch-1",
      startDate: new Date("2026-05-10T00:00:00.000Z"),
      endDateExclusive: new Date("2026-05-13T00:00:00.000Z")
    };

    expect(findBranchByTenant).toHaveBeenCalledWith(prisma, {
      tenantId: "tenant-1",
      branchId: "branch-1"
    });
    expect(sumCompletedRevenue).toHaveBeenCalledWith(prisma, expectedFilters);
    expect(countOrders).toHaveBeenCalledWith(prisma, expectedFilters);
    expect(countProcessingOrders).toHaveBeenCalledWith(prisma, expectedFilters);
    expect(groupOrdersByStatus).toHaveBeenCalledWith(prisma, expectedFilters);
    expect(listTopMenuItems).toHaveBeenCalledWith(prisma, expectedFilters, 5);
    expect(result.filters).toEqual({
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      branchId: "branch-1"
    });
    expect(result.revenue.total).toBe("125000.00");
    expect(result.orders.total).toBe(4);
    expect(result.orders.processing).toBe(2);
    expect(result.orderStatusSummary).toContainEqual({
      status: OrderStatus.SERVED,
      count: 0
    });
  });

  it("keeps tenant isolation by rejecting a branch outside the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    await expect(
      getReportDashboard("tenant-1", {
        branchId: "branch-from-other-tenant",
        startDate: "2026-05-10",
        endDate: "2026-05-12"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.BranchNotFound
    });

    expect(sumCompletedRevenue).not.toHaveBeenCalled();
    expect(countOrders).not.toHaveBeenCalled();
    expect(listTopMenuItems).not.toHaveBeenCalled();
  });
});
