import type { AdminRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { safeHandler } from "../shared/http/async-handler.js";

export const requireAdminRole = (...allowedRoles: AdminRole[]) => {
  return safeHandler((request, _response, next) => {
    const auth = request.auth;

    if (!auth) {
      throw new AppError(ErrorCode.MissingAuthContext);
    }

    if (auth.role === "OWNER" || allowedRoles.includes(auth.role)) {
      next();
      return;
    }

    throw new AppError(ErrorCode.Forbidden);
  });
};
