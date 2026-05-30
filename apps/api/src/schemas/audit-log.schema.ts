import { AuditAction, AuditResourceType } from "@prisma/client";
import { z } from "zod";

const optionalEnumValue = <T extends Record<string, string>>(enumType: T) => {
  return z.preprocess((value) => (value === "" ? undefined : value), z.nativeEnum(enumType).optional());
};

export const listAuditLogsQuerySchema = z.object({
  action: optionalEnumValue(AuditAction),
  resourceType: optionalEnumValue(AuditResourceType),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});
