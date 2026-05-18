import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

const pricePattern = /^\d+(\.\d{1,2})?$/;

export const menuSchema = z.object({
  name: z.string().trim().min(1, MessageKey.ValidationFailed).max(160, MessageKey.ValidationFailed),
  price: z
    .string()
    .trim()
    .regex(pricePattern, MessageKey.MenusPriceInvalidFormat)
    .refine((value) => Number(value) > 0, MessageKey.MenusPriceGreaterThanZero),
  imageFile: z.instanceof(File).nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean()
});

export type MenuFormValues = z.infer<typeof menuSchema>;
