import type { Request, Response } from "express";
import {
  createTableSchema,
  listTablesQuerySchema,
  qrEntryParamsSchema,
  tableParamsSchema,
  updateTableSchema
} from "../schemas/table.schema.js";
import { createTenantTable, getQrEntry, listTables, updateTenantTable } from "../services/table.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams, parseQuery } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

const getAdminId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.userId;
};

export const listTablesController = async (request: Request, response: Response) => {
  const query = parseQuery(request, listTablesQuerySchema);
  const tables = await listTables(getTenantId(request), query.branchId);

  ok(response, {
    tables
  });
};

export const createTableController = async (request: Request, response: Response) => {
  const input = parseBody(request, createTableSchema);
  const table = await createTenantTable(getTenantId(request), input, getAdminId(request));

  created(response, {
    table
  });
};

export const updateTableController = async (request: Request, response: Response) => {
  const params = parseParams(request, tableParamsSchema);
  const input = parseBody(request, updateTableSchema);
  const table = await updateTenantTable(getTenantId(request), params.tableId, input, getAdminId(request));

  ok(response, {
    table
  });
};

export const getQrEntryController = async (request: Request, response: Response) => {
  const params = parseParams(request, qrEntryParamsSchema);
  const qrEntry = await getQrEntry(params.tenantId, params.branchId, params.tableId);

  ok(response, {
    qrEntry
  });
};
