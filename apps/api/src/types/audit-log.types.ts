import type { AuditAction, AuditResourceType } from "@prisma/client";

export type AuditLogDto = {
  id: string;
  tenantId: string;
  actorAdminId: string | null;
  actorAdminName: string | null;
  actorAdminEmail: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata: unknown;
  createdAt: string;
};

export type ListAuditLogsInput = {
  page: number;
  pageSize: number;
  action?: AuditAction;
  resourceType?: AuditResourceType;
};

export type ListAuditLogsResultDto = {
  enabled: boolean;
  auditLogs: AuditLogDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type RecordAuditLogInput = {
  tenantId: string;
  actorAdminId?: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
};
