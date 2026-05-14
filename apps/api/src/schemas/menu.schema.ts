import { z } from "zod";

export const menuParamsSchema = z.object({
  menuId: z.string().min(1)
});

export const publicMenuParamsSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1)
});

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Price must be a non-negative amount with up to 2 decimals")
  .refine((value) => Number(value) > 0, "Price must be greater than 0");

const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

export const createMenuSchema = z.object({
  name: z.string().trim().min(1).max(160),
  price: priceSchema,
  imageUrl: imageUrlSchema,
  isActive: z.boolean().optional()
});

export const updateMenuSchema = z.object({
  name: z.string().trim().min(1).max(160),
  price: priceSchema,
  imageUrl: imageUrlSchema,
  isActive: z.boolean()
});
