import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { ErrorCode, getErrorDefinition } from "../errors/error-catalog.js";
import { logger } from "../logger/logger.js";
import { fail } from "./api-response.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    const definition = getErrorDefinition(ErrorCode.ValidationError);

    logger.warn("request_validation_failed", {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      errorCode: definition.code,
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });

    fail(response, definition.statusCode, {
      code: definition.code,
      message: definition.message,
      details: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    logger.warn("request_app_error", {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      errorCode: error.code,
      statusCode: error.statusCode,
      tenantId: request.auth?.tenantId,
      userId: request.auth?.userId
    });

    fail(response, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return;
  }

  const definition = getErrorDefinition(ErrorCode.InternalError);
  const unexpectedError = error instanceof Error ? error : new Error("Non-error exception thrown");

  logger.error("request_unhandled_error", unexpectedError, {
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
    tenantId: request.auth?.tenantId,
    userId: request.auth?.userId
  });

  fail(response, definition.statusCode, {
    code: definition.code,
    message: definition.message
  });
};
