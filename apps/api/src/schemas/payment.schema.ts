import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const confirmPaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH)
});
