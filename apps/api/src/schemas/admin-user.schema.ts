import { z } from "zod";

const adminRoleSchema = z.enum(["OWNER", "MANAGER", "STAFF"]);

export const adminUserParamsSchema = z.object({
  adminId: z.string().min(1)
});

export const createAdminUserSchema = z.object({
  email: z.string().trim().email().max(191),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
  role: adminRoleSchema
});

export const updateAdminUserSchema = z
  .object({
    email: z.string().trim().email().max(191).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    role: adminRoleSchema.optional(),
    isActive: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const resetAdminPasswordSchema = z.object({
  password: z.string().min(8).max(128)
});
