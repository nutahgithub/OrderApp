import { z } from "zod";

export const menuParamsSchema = z.object({
  menuId: z.string().min(1)
});

export const menuCategoryParamsSchema = z.object({
  categoryId: z.string().min(1)
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

const categoryIdSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

const sortOrderSchema = z.number().int().min(0).max(9999);

export const createMenuSchema = z.object({
  name: z.string().trim().min(1).max(160),
  price: priceSchema,
  imageUrl: imageUrlSchema,
  categoryId: categoryIdSchema,
  isActive: z.boolean().optional(),
  isOutOfStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  sortOrder: sortOrderSchema.optional()
});

export const updateMenuSchema = z.object({
  name: z.string().trim().min(1).max(160),
  price: priceSchema,
  imageUrl: imageUrlSchema,
  categoryId: categoryIdSchema,
  isActive: z.boolean(),
  isOutOfStock: z.boolean(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  sortOrder: sortOrderSchema
});

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  sortOrder: sortOrderSchema.optional()
});

export const updateMenuCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  sortOrder: sortOrderSchema
});
