import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const loginSchema = z.object({
  email: z.string().trim().email(MessageKey.ValidationFailed),
  password: z.string().min(1, MessageKey.ValidationFailed)
});

export type LoginFormValues = z.infer<typeof loginSchema>;
