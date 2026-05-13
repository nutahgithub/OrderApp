import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
};

type SafeRequestHandler = (request: Request, response: Response, next: NextFunction) => void;

export const safeHandler = (handler: SafeRequestHandler): RequestHandler => {
  return (request, response, next) => {
    try {
      handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
};

