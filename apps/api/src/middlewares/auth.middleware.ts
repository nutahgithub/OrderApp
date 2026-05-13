import type { AdminRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-codes.js";
import { safeHandler } from "../shared/http/async-handler.js";
import { verifyAdminToken } from "../shared/security/jwt.js";

export const requireAdminAuth = safeHandler((request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(ErrorCode.MissingToken);
  }

  const token = authorization.slice("Bearer ".length);
  const payload = verifyAdminToken(token);

  request.auth = {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role as AdminRole
  };

  next();
});
