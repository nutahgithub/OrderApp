import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const orderParamsSchema = z.object({
  orderId: z.string().min(1)
});

export const listOrdersQuerySchema = z.object({
  branchId: z.string().min(1),
  status: z.nativeEnum(OrderStatus).optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"])
});
