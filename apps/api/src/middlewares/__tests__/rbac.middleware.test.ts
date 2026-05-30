import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { requireAdminRole } from "../rbac.middleware.js";

const createRequest = (role?: "OWNER" | "MANAGER" | "STAFF"): Request => {
  return {
    auth: role ? { tenantId: "tenant-1", userId: "admin-1", role } : undefined
  } as unknown as Request;
};

const createResponse = (): Response => {
  return {} as Response;
};

const createNext = (): { calls: unknown[]; next: NextFunction } => {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };

  return { calls, next };
};

describe("requireAdminRole", () => {
  it("allows OWNER even when OWNER is not listed explicitly", () => {
    const { calls, next } = createNext();

    requireAdminRole("MANAGER")(createRequest("OWNER"), createResponse(), next);

    expect(calls).toEqual([undefined]);
  });

  it("allows listed roles", () => {
    const { calls, next } = createNext();

    requireAdminRole("MANAGER")(createRequest("MANAGER"), createResponse(), next);

    expect(calls).toEqual([undefined]);
  });

  it("returns 403 for authenticated users without the required role", () => {
    const { calls, next } = createNext();

    requireAdminRole("MANAGER")(createRequest("STAFF"), createResponse(), next);

    const error = calls[0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.Forbidden);
    expect((error as AppError).statusCode).toBe(403);
  });

  it("requires auth context", () => {
    const { calls, next } = createNext();

    requireAdminRole("MANAGER")(createRequest(), createResponse(), next);

    const error = calls[0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.MissingAuthContext);
  });
});
