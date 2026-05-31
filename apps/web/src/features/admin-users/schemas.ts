import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const adminUserSchema = z.object({
  email: z.string().trim().email(MessageKey.ValidationFailed).max(191, MessageKey.ValidationFailed),
  name: z.string().trim().min(1, MessageKey.ValidationFailed).max(120, MessageKey.ValidationFailed),
  password: z.string().min(8, MessageKey.AdminUsersPasswordTooShort).max(128, MessageKey.ValidationFailed),
  role: z.enum(["OWNER", "MANAGER", "STAFF"])
});

export const adminUserEditSchema = z.object({
  email: z.string().trim().email(MessageKey.ValidationFailed).max(191, MessageKey.ValidationFailed),
  name: z.string().trim().min(1, MessageKey.ValidationFailed).max(120, MessageKey.ValidationFailed),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]),
  isActive: z.boolean()
});

export const adminUserPasswordSchema = z.object({
  password: z.string().min(8, MessageKey.AdminUsersPasswordTooShort).max(128, MessageKey.ValidationFailed)
});

export type AdminUserFormValues = z.infer<typeof adminUserSchema>;
export type AdminUserEditFormValues = z.infer<typeof adminUserEditSchema>;
export type AdminUserPasswordFormValues = z.infer<typeof adminUserPasswordSchema>;
