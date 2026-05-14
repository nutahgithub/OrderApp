import { z } from "zod";

export const orderQrParamsSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1)
});

export const orderSummaryParamsSchema = orderQrParamsSchema.extend({
  orderId: z.string().min(1)
});

export const createCustomerOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuId: z.string().min(1),
        quantity: z.number().int().positive().max(99)
      })
    )
    .min(1)
    .max(50)
});
