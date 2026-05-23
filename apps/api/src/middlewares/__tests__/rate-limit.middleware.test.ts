import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { createRateLimitMiddleware } from "../rate-limit.middleware.js";

const createRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    auth: { tenantId: "tenant-1", userId: "admin-1", role: "OWNER" },
    ip: "127.0.0.1",
    params: {},
    requestId: "request-1",
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides
  } as unknown as Request;
};

const createResponse = (): Response => {
  return {
    setHeader: vi.fn()
  } as unknown as Response;
};

const createNext = (): { calls: unknown[]; next: NextFunction } => {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };

  return { calls, next };
};

describe("createRateLimitMiddleware", () => {
  it("allows requests below the configured threshold", () => {
    const { calls, next } = createNext();
    const limiter = createRateLimitMiddleware({
      name: "test-limit",
      maxRequests: 2,
      windowMs: 60_000,
      route: "POST /test",
      now: () => 1_000
    });

    limiter(createRequest(), createResponse(), next);
    limiter(createRequest(), createResponse(), next);

    expect(calls).toEqual([undefined, undefined]);
  });

  it("returns a rate limit error when the threshold is exceeded", () => {
    const { calls, next } = createNext();
    const limiter = createRateLimitMiddleware({
      name: "test-limit",
      maxRequests: 1,
      windowMs: 60_000,
      route: "POST /test",
      now: () => 1_000
    });

    limiter(createRequest(), createResponse(), next);
    limiter(createRequest(), createResponse(), next);

    const error = calls[1];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.RateLimitExceeded);
    expect((error as AppError).statusCode).toBe(429);
  });

  it("resets the counter after the window expires", () => {
    let currentTime = 1_000;
    const { calls, next } = createNext();
    const limiter = createRateLimitMiddleware({
      name: "test-limit",
      maxRequests: 1,
      windowMs: 1_000,
      route: "POST /test",
      now: () => currentTime
    });

    limiter(createRequest(), createResponse(), next);
    currentTime = 2_001;
    limiter(createRequest(), createResponse(), next);

    expect(calls).toEqual([undefined, undefined]);
  });
});
