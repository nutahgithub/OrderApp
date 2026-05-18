import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const customerOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuId: z.string().min(1, MessageKey.ValidationFailed),
        quantity: z.number().int().positive(MessageKey.ValidationFailed)
      })
    )
    .min(1, MessageKey.ValidationFailed)
});
