import type { Request, Response } from "express";
import { listAuditLogsQuerySchema } from "../schemas/audit-log.schema.js";
import { listTenantAuditLogs } from "../services/audit-log.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { ok } from "../shared/http/api-response.js";
import { parseQuery } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const listAuditLogsController = async (request: Request, response: Response) => {
  const query = parseQuery(request, listAuditLogsQuerySchema);
  const result = await listTenantAuditLogs(getTenantId(request), query);

  ok(response, {
    enabled: result.enabled,
    auditLogs: result.auditLogs,
    pagination: result.pagination
  });
};
