import { createHash } from "node:crypto";
import { z } from "zod";
import type { Request } from "express";

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

type CanonicalValue = null | boolean | number | string | CanonicalValue[] | { [key: string]: CanonicalValue };

const canonicalize = (value: CanonicalValue): CanonicalValue => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<{ [key: string]: CanonicalValue }>((result, key) => {
        result[key] = canonicalize(value[key] ?? null);
        return result;
      }, {});
  }

  return value;
};

export const parseIdempotencyKey = (request: Request): string => {
  return idempotencyKeySchema.parse(request.header("Idempotency-Key"));
};

export const hashIdempotencyPayload = (payload: CanonicalValue): string => {
  return createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
};
