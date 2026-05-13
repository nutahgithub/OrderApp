import type { Request, Response } from "express";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-codes.js";
import { ok } from "../shared/http/api-response.js";
import { parseBody } from "../shared/http/validation.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { getCurrentAdmin, loginAdmin } from "../services/auth.service.js";

export const loginAdminController = async (request: Request, response: Response) => {
  const input = parseBody(request, loginSchema);
  const result = await loginAdmin(input);

  ok(response, result);
};

export const getCurrentAdminController = async (
  request: Request,
  response: Response
) => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  const admin = await getCurrentAdmin(request.auth.userId, request.auth.tenantId);

  ok(response, {
    admin
  });
};
