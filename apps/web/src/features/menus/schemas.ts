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
  categoryId: z.string().nullable(),
  isActive: z.boolean(),
  isOutOfStock: z.boolean(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999)
});

export type MenuFormValues = z.infer<typeof menuSchema>;

export const menuCategorySchema = z.object({
  name: z.string().trim().min(1, MessageKey.ValidationFailed).max(80, MessageKey.ValidationFailed),
  sortOrder: z.number().int().min(0).max(9999)
});
