import type { AdminUser } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminUser,
  findAdminUserByTenant,
  findAdminUserByTenantEmail,
  listAdminUsersByTenant,
  updateAdminUserByTenant,
  updateAdminUserPasswordByTenant
} from "../../repositories/admin-user.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import {
  createTenantAdminUser,
  listTenantAdminUsers,
  resetTenantAdminPassword,
  updateTenantAdminUser
} from "../admin-user.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    adminUser: {}
  }
}));

vi.mock("../../repositories/admin-user.repository.js", () => ({
  createAdminUser: vi.fn(),
  findAdminUserByTenant: vi.fn(),
  findAdminUserByTenantEmail: vi.fn(),
  listAdminUsersByTenant: vi.fn(),
  updateAdminUserByTenant: vi.fn(),
  updateAdminUserPasswordByTenant: vi.fn()
}));

vi.mock("../../shared/security/password.js", () => ({
  hashPassword: vi.fn(() => "hashed-password")
}));

vi.mock("../audit-log.service.js", () => ({
  recordAuditLog: vi.fn()
}));

const adminUserFixture = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: "admin-1",
  tenantId: "tenant-1",
  email: "staff@example.com",
  name: "Staff",
  passwordHash: "hashed-password",
  role: "STAFF",
  isActive: true,
  createdAt: new Date("2026-05-30T10:00:00.000Z"),
  updatedAt: new Date("2026-05-30T10:00:00.000Z"),
  ...overrides
});

const ownerActor = {
  adminId: "owner-1",
  tenantId: "tenant-1",
  role: "OWNER" as const
};

const managerActor = {
  adminId: "manager-1",
  tenantId: "tenant-1",
  role: "MANAGER" as const
};

describe("admin user service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists admin users with tenant isolation", async () => {
    vi.mocked(listAdminUsersByTenant).mockResolvedValue([adminUserFixture()]);

    const result = await listTenantAdminUsers(ownerActor);

    expect(listAdminUsersByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1");
    expect(result).toEqual([
      {
        id: "admin-1",
        tenantId: "tenant-1",
        email: "staff@example.com",
        name: "Staff",
        role: "STAFF",
        isActive: true,
        createdAt: "2026-05-30T10:00:00.000Z",
        updatedAt: "2026-05-30T10:00:00.000Z"
      }
    ]);
  });

  it("allows an owner to create staff", async () => {
    vi.mocked(findAdminUserByTenantEmail).mockResolvedValue(null);
    vi.mocked(createAdminUser).mockResolvedValue(adminUserFixture());

    const result = await createTenantAdminUser(ownerActor, {
      email: " STAFF@Example.com ",
      name: " Staff ",
      password: "password123",
      role: "STAFF"
    });

    expect(createAdminUser).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      email: "staff@example.com",
      name: "Staff",
      passwordHash: "hashed-password",
      role: "STAFF"
    });
    expect(result.role).toBe("STAFF");
  });

  it("blocks a manager from creating an owner", async () => {
    await expect(
      createTenantAdminUser(managerActor, {
        email: "owner@example.com",
        name: "Owner",
        password: "password123",
        role: "OWNER"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.AdminRoleAssignmentForbidden
    });
    expect(createAdminUser).not.toHaveBeenCalled();
  });

  it("blocks duplicate email inside the same tenant", async () => {
    vi.mocked(findAdminUserByTenantEmail).mockResolvedValue(adminUserFixture());

    await expect(
      createTenantAdminUser(ownerActor, {
        email: "staff@example.com",
        name: "Staff",
        password: "password123",
        role: "STAFF"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.AdminEmailAlreadyExists
    });
  });

  it("blocks updates outside the tenant scope", async () => {
    vi.mocked(findAdminUserByTenant).mockResolvedValue(null);

    await expect(updateTenantAdminUser(ownerActor, "admin-other-tenant", { name: "New" })).rejects.toMatchObject({
      code: ErrorCode.AdminNotFound
    });
    expect(updateAdminUserByTenant).not.toHaveBeenCalled();
  });

  it("blocks self disable", async () => {
    vi.mocked(findAdminUserByTenant).mockResolvedValue(adminUserFixture({ id: "owner-1", role: "OWNER" }));

    await expect(updateTenantAdminUser(ownerActor, "owner-1", { isActive: false })).rejects.toMatchObject({
      code: ErrorCode.AdminSelfAccessChangeForbidden
    });
    expect(updateAdminUserByTenant).not.toHaveBeenCalled();
  });

  it("allows an owner to disable a staff admin", async () => {
    vi.mocked(findAdminUserByTenant).mockResolvedValue(adminUserFixture());
    vi.mocked(updateAdminUserByTenant).mockResolvedValue(adminUserFixture({ isActive: false }));

    const result = await updateTenantAdminUser(ownerActor, "admin-1", { isActive: false });

    expect(updateAdminUserByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      adminId: "admin-1",
      data: {
        isActive: false
      }
    });
    expect(result.isActive).toBe(false);
  });

  it("blocks a manager from resetting an owner password", async () => {
    vi.mocked(findAdminUserByTenant).mockResolvedValue(adminUserFixture({ role: "OWNER" }));

    await expect(resetTenantAdminPassword(managerActor, "owner-1", { password: "password123" })).rejects.toMatchObject({
      code: ErrorCode.AdminRoleAssignmentForbidden
    });
    expect(updateAdminUserPasswordByTenant).not.toHaveBeenCalled();
  });

  it("resets a staff password in the current tenant", async () => {
    vi.mocked(findAdminUserByTenant).mockResolvedValue(adminUserFixture());
    vi.mocked(updateAdminUserPasswordByTenant).mockResolvedValue(adminUserFixture());

    await resetTenantAdminPassword(ownerActor, "admin-1", { password: "password123" });

    expect(updateAdminUserPasswordByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      adminId: "admin-1",
      passwordHash: "hashed-password"
    });
  });
});
