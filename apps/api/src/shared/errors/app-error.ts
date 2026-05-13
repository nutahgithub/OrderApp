import type { ErrorCode } from "./error-catalog.js";
import { getErrorDefinition } from "./error-catalog.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  public constructor(code: ErrorCode, options?: { message?: string; statusCode?: number; details?: unknown }) {
    const definition = getErrorDefinition(code);

    super(options?.message ?? definition.message);
    this.statusCode = options?.statusCode ?? definition.statusCode;
    this.code = code;
    this.details = options?.details;
  }
}
