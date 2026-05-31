import { findAdminByIdAndTenant } from "../repositories/auth.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { asyncHandler } from "../shared/http/async-handler.js";
import { prisma } from "../shared/prisma/client.js";
import { verifyAdminToken } from "../shared/security/jwt.js";

export const requireAdminAuth = asyncHandler(async (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(ErrorCode.MissingToken);
  }

  const token = authorization.slice("Bearer ".length);
  const payload = verifyAdminToken(token);
  const admin = await findAdminByIdAndTenant(prisma, payload.sub, payload.tenantId);

  if (!admin) {
    throw new AppError(ErrorCode.InvalidToken);
  }

  request.auth = {
    userId: admin.id,
    tenantId: admin.tenantId,
    role: admin.role
  };

  next();
});
