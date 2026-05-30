import type { AuditLogRecord } from "../../repositories/audit-log.repository.js";
import { countAuditLogsByTenant, createAuditLog, listAuditLogsByTenant } from "../../repositories/audit-log.repository.js";
import { listTenantAuditLogs, recordAuditLog } from "../audit-log.service.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  AUDIT_LOG_ENABLED: true
}));

vi.mock("../../config/env.js", () => ({
  env: envMock
}));

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    auditLog: {}
  }
}));

vi.mock("../../repositories/audit-log.repository.js", () => ({
  countAuditLogsByTenant: vi.fn(),
  createAuditLog: vi.fn(),
  listAuditLogsByTenant: vi.fn()
}));

const auditLogFixture = (overrides: Partial<AuditLogRecord> = {}): AuditLogRecord => ({
  id: "audit-1",
  tenantId: "tenant-1",
  actorAdminId: "admin-1",
  action: "ORDER_STATUS_UPDATED",
  resourceType: "ORDER",
  resourceId: "order-1",
  metadata: {
    previousStatus: "PENDING",
    status: "CONFIRMED"
  },
  createdAt: new Date("2026-05-30T06:00:00.000Z"),
  actorAdmin: {
    id: "admin-1",
    name: "Manager",
    email: "manager@example.com"
  },
  ...overrides
});

describe("audit log service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.AUDIT_LOG_ENABLED = true;
  });

  it("records audit logs without sensitive credentials", async () => {
    await recordAuditLog({
      tenantId: "tenant-1",
      actorAdminId: "admin-1",
      action: "ADMIN_LOGIN",
      resourceType: "ADMIN_USER",
      resourceId: "admin-1",
      metadata: {
        role: "MANAGER"
      }
    });

    expect(createAuditLog).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      actorAdminId: "admin-1",
      action: "ADMIN_LOGIN",
      resourceType: "ADMIN_USER",
      resourceId: "admin-1",
      metadata: {
        role: "MANAGER"
      }
    });
  });

  it("does not break the caller when audit write fails", async () => {
    vi.mocked(createAuditLog).mockRejectedValue(new Error("database unavailable"));

    await expect(
      recordAuditLog({
        tenantId: "tenant-1",
        action: "PAYMENT_CONFIRMED",
        resourceType: "PAYMENT",
        resourceId: "payment-1"
      })
    ).resolves.toBeUndefined();
  });

  it("lists audit logs only for the current tenant", async () => {
    vi.mocked(listAuditLogsByTenant).mockResolvedValue([auditLogFixture()]);
    vi.mocked(countAuditLogsByTenant).mockResolvedValue(1);

    const result = await listTenantAuditLogs("tenant-1", {
      action: "ORDER_STATUS_UPDATED",
      resourceType: "ORDER",
      page: 1,
      pageSize: 25
    });

    expect(listAuditLogsByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1", {
      action: "ORDER_STATUS_UPDATED",
      resourceType: "ORDER",
      page: 1,
      pageSize: 25
    });
    expect(countAuditLogsByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1", {
      action: "ORDER_STATUS_UPDATED",
      resourceType: "ORDER",
      page: 1,
      pageSize: 25
    });
    expect(result.auditLogs[0]).toMatchObject({
      id: "audit-1",
      tenantId: "tenant-1",
      actorAdminName: "Manager",
      actorAdminEmail: "manager@example.com",
      action: "ORDER_STATUS_UPDATED",
      resourceType: "ORDER",
      resourceId: "order-1"
    });
  });

  it("does not touch audit storage when audit logging is disabled", async () => {
    envMock.AUDIT_LOG_ENABLED = false;

    await recordAuditLog({
      tenantId: "tenant-1",
      actorAdminId: "admin-1",
      action: "MENU_UPDATED",
      resourceType: "MENU",
      resourceId: "menu-1"
    });
    const result = await listTenantAuditLogs("tenant-1", {
      page: 1,
      pageSize: 25
    });

    expect(createAuditLog).not.toHaveBeenCalled();
    expect(listAuditLogsByTenant).not.toHaveBeenCalled();
    expect(countAuditLogsByTenant).not.toHaveBeenCalled();
    expect(result).toEqual({
      enabled: false,
      auditLogs: [],
      pagination: {
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 1
      }
    });
  });
});
