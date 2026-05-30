import type { AuditLogRecord } from "../repositories/audit-log.repository.js";
import { countAuditLogsByTenant, createAuditLog, listAuditLogsByTenant } from "../repositories/audit-log.repository.js";
import { env } from "../config/env.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { AuditLogDto, ListAuditLogsInput, ListAuditLogsResultDto, RecordAuditLogInput } from "../types/audit-log.types.js";

const toAuditLogDto = (auditLog: AuditLogRecord): AuditLogDto => {
  return {
    id: auditLog.id,
    tenantId: auditLog.tenantId,
    actorAdminId: auditLog.actorAdminId,
    actorAdminName: auditLog.actorAdmin?.name ?? null,
    actorAdminEmail: auditLog.actorAdmin?.email ?? null,
    action: auditLog.action,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    metadata: auditLog.metadata,
    createdAt: auditLog.createdAt.toISOString()
  };
};

export const recordAuditLog = async (input: RecordAuditLogInput): Promise<void> => {
  if (!env.AUDIT_LOG_ENABLED) {
    return;
  }

  try {
    await createAuditLog(prisma, input);
  } catch (error: unknown) {
    logger.warn("audit_log_write_failed", {
      tenantId: input.tenantId,
      actorAdminId: input.actorAdminId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      errorMessage: error instanceof Error ? error.message : "Unknown audit log error"
    });
  }
};

export const listTenantAuditLogs = async (
  tenantId: string,
  input: ListAuditLogsInput
): Promise<ListAuditLogsResultDto> => {
  if (!env.AUDIT_LOG_ENABLED) {
    return {
      enabled: false,
      auditLogs: [],
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 0,
        totalPages: 1
      }
    };
  }

  const [auditLogs, total] = await Promise.all([
    listAuditLogsByTenant(prisma, tenantId, input),
    countAuditLogsByTenant(prisma, tenantId, input)
  ]);

  return {
    enabled: true,
    auditLogs: auditLogs.map(toAuditLogDto),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize))
    }
  };
};
