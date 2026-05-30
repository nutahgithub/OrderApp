import type { Branch, RestaurantTable } from "@prisma/client";
import { TableStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBranchByTenant } from "../../repositories/branch.repository.js";
import {
  createTable,
  findTableQrEntry,
  listTablesByTenantBranch,
  updateTableByTenant
} from "../../repositories/table.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { createTenantTable, getQrEntry, listTables, updateTenantTable } from "../table.service.js";

vi.mock("../../config/env.js", () => ({
  env: {
    WEB_APP_URL: "http://localhost:5173"
  }
}));

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    branch: {},
    restaurantTable: {}
  }
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  findBranchByTenant: vi.fn()
}));

vi.mock("../../repositories/table.repository.js", () => ({
  createTable: vi.fn(),
  findTableQrEntry: vi.fn(),
  listTablesByTenantBranch: vi.fn(),
  updateTableByTenant: vi.fn()
}));

vi.mock("../audit-log.service.js", () => ({
  recordAuditLog: vi.fn()
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

describe("table service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists tables only after validating the branch belongs to the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(listTablesByTenantBranch).mockResolvedValue([tableFixture()]);

    const result = await listTables("tenant-1", "branch-1");

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      branchId: "branch-1",
      tenantId: "tenant-1"
    });
    expect(listTablesByTenantBranch).toHaveBeenCalledWith(expect.any(Object), {
      branchId: "branch-1",
      tenantId: "tenant-1"
    });
    expect(result[0]).toMatchObject({
      id: "table-1",
      qrUrl: "http://localhost:5173/qr/tenant-1/branch-1/table-1"
    });
  });

  it("does not create a table for a branch outside the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    await expect(
      createTenantTable("tenant-1", {
        branchId: "other-branch",
        name: "Table 2"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.BranchNotFound
    });
    expect(createTable).not.toHaveBeenCalled();
  });

  it("updates a table inside the tenant scope", async () => {
    vi.mocked(updateTableByTenant).mockResolvedValue(tableFixture({ name: "Window Table" }));

    const result = await updateTenantTable("tenant-1", "table-1", {
      name: " Window Table ",
      status: TableStatus.OCCUPIED
    });

    expect(updateTableByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      tableId: "table-1",
      name: "Window Table",
      status: TableStatus.OCCUPIED
    });
    expect(result.name).toBe("Window Table");
  });

  it("returns TABLE_NOT_FOUND for a QR entry outside the requested context", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue(null);

    await expect(getQrEntry("tenant-1", "branch-1", "missing-table")).rejects.toMatchObject({
      code: ErrorCode.TableNotFound
    });
  });
});
