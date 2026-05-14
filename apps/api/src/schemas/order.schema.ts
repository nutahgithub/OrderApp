import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const orderParamsSchema = z.object({
  orderId: z.string().min(1)
});

export const qrOrderParamsSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1)
});

export const qrOrderDetailParamsSchema = qrOrderParamsSchema.extend({
  orderId: z.string().min(1)
});

export const listOrdersQuerySchema = z.object({
  branchId: z.string().min(1),
  status: z.nativeEnum(OrderStatus).optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"])
});

export const createQrOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuId: z.string().min(1),
        quantity: z.number().int().min(1).max(99)
      })
    )
    .min(1)
});
