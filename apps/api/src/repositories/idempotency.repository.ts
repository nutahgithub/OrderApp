import type { IdempotencyAction, IdempotencyKey } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type IdempotencyKeyRecord = IdempotencyKey;

export const findIdempotencyKey = async (
  db: DbClient,
  input: {
    tenantId: string;
    action: IdempotencyAction;
    key: string;
  }
): Promise<IdempotencyKeyRecord | null> => {
  return db.idempotencyKey.findUnique({
    where: {
      tenantId_action_key: {
        tenantId: input.tenantId,
        action: input.action,
        key: input.key
      }
    }
  });
};

export const createIdempotencyKey = async (
  db: DbClient,
  input: {
    tenantId: string;
    action: IdempotencyAction;
    key: string;
    requestHash: string;
  }
): Promise<IdempotencyKeyRecord> => {
  return db.idempotencyKey.create({
    data: {
      tenantId: input.tenantId,
      action: input.action,
      key: input.key,
      requestHash: input.requestHash
    }
  });
};

export const attachIdempotencyResource = async (
  db: DbClient,
  input: {
    id: string;
    resourceId: string;
  }
): Promise<IdempotencyKeyRecord> => {
  return db.idempotencyKey.update({
    where: {
      id: input.id
    },
    data: {
      resourceId: input.resourceId
    }
  });
};
