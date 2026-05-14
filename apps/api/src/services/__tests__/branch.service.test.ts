// npx vitest run src\services\__tests__\branch.service.test.ts

import type { Branch } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBranch, listBranchesByTenant, updateBranchByTenant } from "../../repositories/branch.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { createTenantBranch, listBranches, updateTenantBranch } from "../branch.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    branch: {}
  }
}));

vi.mock("../../repositories/branch.repository.js", () => ({
  createBranch: vi.fn(),
  listBranchesByTenant: vi.fn(),
  updateBranchByTenant: vi.fn()
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
});
