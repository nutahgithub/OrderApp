import type { Request, Response } from "express";
import { createBranchSchema, branchParamsSchema, updateBranchSchema } from "../schemas/branch.schema.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams } from "../shared/http/validation.js";
import { createTenantBranch, listBranches, updateTenantBranch } from "../services/branch.service.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const listBranchesController = async (request: Request, response: Response) => {
  const branches = await listBranches(getTenantId(request));

  ok(response, {
    branches
  });
};

export const createBranchController = async (request: Request, response: Response) => {
  const input = parseBody(request, createBranchSchema);
  const branch = await createTenantBranch(getTenantId(request), input);

  created(response, {
    branch
  });
};

export const updateBranchController = async (request: Request, response: Response) => {
  const params = parseParams(request, branchParamsSchema);
  const input = parseBody(request, updateBranchSchema);
  const branch = await updateTenantBranch(getTenantId(request), params.branchId, input);

  ok(response, {
    branch
  });
};
