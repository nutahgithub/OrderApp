import type { Request, Response } from "express";
import { uploadImageSchema } from "../schemas/upload.schema.js";
import { uploadMenuImage } from "../services/upload.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created } from "../shared/http/api-response.js";
import { parseBody } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const uploadMenuImageController = async (request: Request, response: Response) => {
  const input = parseBody(request, uploadImageSchema);
  const upload = await uploadMenuImage(getTenantId(request), input);

  created(response, {
    upload
  });
};
