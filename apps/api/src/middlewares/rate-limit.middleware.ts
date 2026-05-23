import type { Request, RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { logger } from "../shared/logger/logger.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  name: string;
  maxRequests: number;
  windowMs: number;
  route: string;
  now?: () => number;
};

const getRequestIp = (request: Request): string => {
  return request.ip || request.socket.remoteAddress || "unknown";
};

const getTenantId = (request: Request): string => {
  const tenantIdParam = request.params.tenantId;

  if (typeof tenantIdParam === "string") {
    return tenantIdParam;
  }

  return request.auth?.tenantId ?? "anonymous";
};

export const createRateLimitMiddleware = (options: RateLimitOptions): RequestHandler => {
  const store = new Map<string, RateLimitEntry>();
  const now = options.now ?? Date.now;

  return (request, response, next) => {
    const currentTime = now();
    const tenantId = getTenantId(request);
    const ip = getRequestIp(request);
    const key = `${options.name}:${tenantId}:${ip}`;
    const existingEntry = store.get(key);
    const entry =
      existingEntry && existingEntry.resetAt > currentTime
        ? existingEntry
        : {
            count: 0,
            resetAt: currentTime + options.windowMs
          };

    entry.count += 1;
    store.set(key, entry);

    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000));
    response.setHeader("RateLimit-Limit", String(options.maxRequests));
    response.setHeader("RateLimit-Remaining", String(Math.max(0, options.maxRequests - entry.count)));
    response.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > options.maxRequests) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
      logger.warn("rate_limit_exceeded", {
        requestId: request.requestId,
        tenantId,
        ip,
        route: options.route,
        limitName: options.name,
        limit: options.maxRequests,
        windowMs: options.windowMs,
        retryAfterSeconds
      });

      next(
        new AppError(ErrorCode.RateLimitExceeded, {
          details: {
            limit: options.maxRequests,
            windowMs: options.windowMs,
            retryAfterSeconds
          }
        })
      );
      return;
    }

    next();
  };
};

export const publicOrderRateLimit = createRateLimitMiddleware({
  name: "public-order",
  maxRequests: 10,
  windowMs: 60_000,
  route: "POST /qr/:tenantId/:branchId/:tableId/orders"
});

export const menuImageUploadRateLimit = createRateLimitMiddleware({
  name: "menu-image-upload",
  maxRequests: 20,
  windowMs: 60_000,
  route: "POST /admin/uploads/menu-images"
});
