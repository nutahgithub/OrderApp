import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { ErrorCode, getErrorDefinition } from "../errors/error-catalog.js";
import { fail } from "./api-response.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    const definition = getErrorDefinition(ErrorCode.ValidationError);

    fail(response, definition.statusCode, {
      code: definition.code,
      message: definition.message,
      details: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    fail(response, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return;
  }

  const definition = getErrorDefinition(ErrorCode.InternalError);

  fail(response, definition.statusCode, {
    code: definition.code,
    message: definition.message
  });
};
