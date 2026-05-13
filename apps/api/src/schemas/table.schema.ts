import { TableStatus } from "@prisma/client";
import { z } from "zod";

export const tableParamsSchema = z.object({
  tableId: z.string().min(1)
});

export const listTablesQuerySchema = z.object({
  branchId: z.string().min(1)
});

export const qrEntryParamsSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1)
});

const tableStatusSchema = z.nativeEnum(TableStatus);

export const createTableSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  status: tableStatusSchema.optional()
});

export const updateTableSchema = z.object({
  name: z.string().trim().min(1).max(120),
  status: tableStatusSchema
});
