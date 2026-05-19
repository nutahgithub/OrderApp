import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logger } from "./logger.js";
import { recordHttpRequest } from "../observability/metrics.js";

const shouldSkipRequestLog = (path: string): boolean => {
  return path === "/health";
};

export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = request.header("x-request-id") ?? randomUUID();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  next();
};

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    if (shouldSkipRequestLog(request.path)) {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = response.statusCode;
    recordHttpRequest({
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs
    });

    const context = {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs: Math.round(durationMs),
      tenantId: request.auth?.tenantId,
      userId: request.auth?.userId,
      ip: request.ip,
      userAgent: request.header("user-agent")
    };

    if (statusCode >= 500) {
      logger.error("http_request_completed", undefined, context);
      return;
    }

    if (statusCode >= 400) {
      logger.warn("http_request_completed", context);
      return;
    }

    logger.info("http_request_completed", context);
  });

  next();
};
