import type { Branch } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countBranchTablesAndOrders,
  createBranch,
  deleteEmptyBranchByTenant,
  findBranchByTenant,
  listBranchesByTenant,
  updateBranchByTenant
} from "../../repositories/branch.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import {
  createTenantBranch,
  deleteTenantBranch,
  listBranches,
  updateTenantBranch
} from "../branch.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    branch: {},
    order: {},
    restaurantTable: {}
  }
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  countBranchTablesAndOrders: vi.fn(),
  createBranch: vi.fn(),
  deleteEmptyBranchByTenant: vi.fn(),
  findBranchByTenant: vi.fn(),
  listBranchesByTenant: vi.fn(),
  updateBranchByTenant: vi.fn()
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

describe("branch service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists branches with tenant isolation", async () => {
    vi.mocked(listBranchesByTenant).mockResolvedValue([branchFixture()]);

    const result = await listBranches("tenant-1");

    expect(listBranchesByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1");
    expect(result).toEqual([
      {
        id: "branch-1",
        tenantId: "tenant-1",
        name: "Main Branch",
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z"
      }
    ]);
  });

  it("creates a branch for the current tenant", async () => {
    vi.mocked(createBranch).mockResolvedValue(branchFixture({ name: "New Branch" }));

    const result = await createTenantBranch("tenant-1", {
      name: "  New Branch  "
    });

    expect(createBranch).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      name: "New Branch"
    });
    expect(result.name).toBe("New Branch");
  });

  it("returns BRANCH_NOT_FOUND when updating outside the tenant scope", async () => {
    vi.mocked(updateBranchByTenant).mockResolvedValue(null);

    await expect(
      updateTenantBranch("tenant-1", "branch-from-other-tenant", {
        name: "Renamed"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.BranchNotFound
    });
    expect(updateBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      branchId: "branch-from-other-tenant",
      tenantId: "tenant-1",
      name: "Renamed"
    });
  });

  it("deletes a branch when it has no tables or orders", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(countBranchTablesAndOrders).mockResolvedValue({ tables: 0, orders: 0 });
    vi.mocked(deleteEmptyBranchByTenant).mockResolvedValue(1);

    await deleteTenantBranch("tenant-1", "branch-1");

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      branchId: "branch-1",
      tenantId: "tenant-1"
    });
    expect(deleteEmptyBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      branchId: "branch-1",
      tenantId: "tenant-1"
    });
  });

  it("blocks deletion when the branch already has tables", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(countBranchTablesAndOrders).mockResolvedValue({ tables: 1, orders: 0 });

    await expect(deleteTenantBranch("tenant-1", "branch-1")).rejects.toMatchObject({
      code: ErrorCode.BranchNotEmpty
    });
    expect(deleteEmptyBranchByTenant).not.toHaveBeenCalled();
  });

  it("blocks deletion when the branch already has orders", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(branchFixture());
    vi.mocked(countBranchTablesAndOrders).mockResolvedValue({ tables: 0, orders: 1 });

    await expect(deleteTenantBranch("tenant-1", "branch-1")).rejects.toMatchObject({
      code: ErrorCode.BranchNotEmpty
    });
    expect(deleteEmptyBranchByTenant).not.toHaveBeenCalled();
  });

  it("returns BRANCH_NOT_FOUND for a branch outside the tenant", async () => {
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    await expect(deleteTenantBranch("tenant-1", "other-branch")).rejects.toMatchObject({
      code: ErrorCode.BranchNotFound
    });
    expect(countBranchTablesAndOrders).not.toHaveBeenCalled();
  });
});
