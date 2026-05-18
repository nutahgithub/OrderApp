import type { Request, Response } from "express";
import { reportDashboardQuerySchema } from "../schemas/report.schema.js";
import { getReportDashboard } from "../services/report.service.js";
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

export const getReportDashboardController = async (request: Request, response: Response) => {
  const query = parseQuery(request, reportDashboardQuerySchema);
  const dashboard = await getReportDashboard(getTenantId(request), query);

  ok(response, {
    dashboard
  });
};
