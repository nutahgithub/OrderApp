import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-catalog.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(ErrorCode.RouteNotFound, {
      message: `Route ${request.method} ${request.path} not found`
    })
  );
};
