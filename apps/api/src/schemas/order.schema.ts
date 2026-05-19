import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
}).refine(
  (value) => {
    if (!value.startDate || !value.endDate) {
      return true;
    }

    return value.startDate <= value.endDate;
  },
  {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"]
  }
);

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
