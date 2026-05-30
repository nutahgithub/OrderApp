import type { AuditLog, AdminUser, Prisma } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";
import type { ListAuditLogsInput, RecordAuditLogInput } from "../types/audit-log.types.js";

export type AuditLogRecord = AuditLog & {
  actorAdmin: Pick<AdminUser, "id" | "name" | "email"> | null;
};

const buildAuditLogWhere = (
  tenantId: string,
  input: Pick<ListAuditLogsInput, "action" | "resourceType">
): Prisma.AuditLogWhereInput => {
  return {
    tenantId,
    action: input.action,
    resourceType: input.resourceType
  };
};

export const createAuditLog = async (db: DbClient, input: RecordAuditLogInput): Promise<void> => {
  await db.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorAdminId: input.actorAdminId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? undefined
    }
  });
};

export const listAuditLogsByTenant = async (
  db: DbClient,
  tenantId: string,
  input: ListAuditLogsInput
): Promise<AuditLogRecord[]> => {
  return db.auditLog.findMany({
    where: buildAuditLogWhere(tenantId, input),
    include: {
      actorAdmin: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize
  });
};

export const countAuditLogsByTenant = async (
  db: DbClient,
  tenantId: string,
  input: Pick<ListAuditLogsInput, "action" | "resourceType">
): Promise<number> => {
  return db.auditLog.count({
    where: buildAuditLogWhere(tenantId, input)
  });
};
