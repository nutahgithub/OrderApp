import type { Branch } from "@prisma/client";
import {
  countBranchTablesAndOrders,
  createBranch,
  deleteEmptyBranchByTenant,
  findBranchByTenant,
  listBranchesByTenant,
  updateBranchByTenant
} from "../repositories/branch.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import type { BranchDto, CreateBranchInput, UpdateBranchInput } from "../types/branch.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const toBranchDto = (branch: Branch): BranchDto => {
  return {
    id: branch.id,
    tenantId: branch.tenantId,
    name: branch.name,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString()
  };
};

export const listBranches = async (tenantId: string): Promise<BranchDto[]> => {
  const branches = await listBranchesByTenant(prisma, tenantId);

  return branches.map(toBranchDto);
};

export const createTenantBranch = async (
  tenantId: string,
  input: CreateBranchInput,
  actorAdminId?: string
): Promise<BranchDto> => {
  const branch = await createBranch(prisma, {
    tenantId,
    name: input.name.trim()
  });

  logger.info("branch_created", {
    tenantId,
    branchId: branch.id
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "BRANCH_CREATED",
    resourceType: "BRANCH",
    resourceId: branch.id
  });

  return toBranchDto(branch);
};

export const updateTenantBranch = async (
  tenantId: string,
  branchId: string,
  input: UpdateBranchInput,
  actorAdminId?: string
): Promise<BranchDto> => {
  const branch = await updateBranchByTenant(prisma, {
    branchId,
    tenantId,
    name: input.name.trim()
  });

  if (!branch) {
    throw new AppError(ErrorCode.BranchNotFound);
  }

  logger.info("branch_updated", {
    tenantId,
    branchId: branch.id
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "BRANCH_UPDATED",
    resourceType: "BRANCH",
    resourceId: branch.id
  });

  return toBranchDto(branch);
};

export const deleteTenantBranch = async (tenantId: string, branchId: string, actorAdminId?: string): Promise<void> => {
  const branch = await findBranchByTenant(prisma, {
    branchId,
    tenantId
  });

  if (!branch) {
    throw new AppError(ErrorCode.BranchNotFound);
  }

  const usageCounts = await countBranchTablesAndOrders(prisma, {
    branchId,
    tenantId
  });

  if (usageCounts.tables > 0 || usageCounts.orders > 0) {
    throw new AppError(ErrorCode.BranchNotEmpty, {
      details: usageCounts
    });
  }

  const deletedCount = await deleteEmptyBranchByTenant(prisma, {
    branchId,
    tenantId
  });

  if (deletedCount === 0) {
    throw new AppError(ErrorCode.BranchNotEmpty);
  }

  logger.info("branch_deleted", {
    tenantId,
    branchId
  });
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "BRANCH_DELETED",
    resourceType: "BRANCH",
    resourceId: branchId
  });
};
