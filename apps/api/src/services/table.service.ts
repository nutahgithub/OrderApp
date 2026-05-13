import type { RestaurantTable } from "@prisma/client";
import { env } from "../config/env.js";
import { findBranchByTenant } from "../repositories/branch.repository.js";
import {
  createTable,
  findTableQrEntry,
  listTablesByTenantBranch,
  updateTableByTenant
} from "../repositories/table.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { CreateTableInput, QrEntryDto, TableDto, UpdateTableInput } from "../types/table.types.js";

const buildQrUrl = (table: Pick<RestaurantTable, "tenantId" | "branchId" | "id">): string => {
  return `${env.WEB_APP_URL}/qr/${table.tenantId}/${table.branchId}/${table.id}`;
};

const toTableDto = (table: RestaurantTable): TableDto => {
  return {
    id: table.id,
    tenantId: table.tenantId,
    branchId: table.branchId,
    name: table.name,
    status: table.status,
    qrUrl: buildQrUrl(table),
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString()
  };
};

const ensureBranchBelongsToTenant = async (tenantId: string, branchId: string): Promise<void> => {
  const branch = await findBranchByTenant(prisma, {
    branchId,
    tenantId
  });

  if (!branch) {
    throw new AppError(ErrorCode.BranchNotFound);
  }
};

export const listTables = async (tenantId: string, branchId: string): Promise<TableDto[]> => {
  await ensureBranchBelongsToTenant(tenantId, branchId);

  const tables = await listTablesByTenantBranch(prisma, {
    tenantId,
    branchId
  });

  return tables.map(toTableDto);
};

export const createTenantTable = async (tenantId: string, input: CreateTableInput): Promise<TableDto> => {
  await ensureBranchBelongsToTenant(tenantId, input.branchId);

  const table = await createTable(prisma, {
    tenantId,
    branchId: input.branchId,
    name: input.name.trim(),
    status: input.status
  });

  logger.info("table_created", {
    tenantId,
    branchId: table.branchId,
    tableId: table.id,
    status: table.status
  });

  return toTableDto(table);
};

export const updateTenantTable = async (
  tenantId: string,
  tableId: string,
  input: UpdateTableInput
): Promise<TableDto> => {
  const table = await updateTableByTenant(prisma, {
    tenantId,
    tableId,
    name: input.name.trim(),
    status: input.status
  });

  if (!table) {
    throw new AppError(ErrorCode.TableNotFound);
  }

  logger.info("table_updated", {
    tenantId,
    branchId: table.branchId,
    tableId: table.id,
    status: table.status
  });

  return toTableDto(table);
};

export const getQrEntry = async (tenantId: string, branchId: string, tableId: string): Promise<QrEntryDto> => {
  const table = await findTableQrEntry(prisma, {
    tenantId,
    branchId,
    tableId
  });

  if (!table) {
    throw new AppError(ErrorCode.TableNotFound);
  }

  return {
    tenantId: table.tenantId,
    branch: table.branch,
    table: {
      id: table.id,
      name: table.name,
      status: table.status
    }
  };
};
