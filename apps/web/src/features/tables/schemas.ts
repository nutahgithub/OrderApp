import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const tableSchema = z.object({
  branchId: z.string().trim().min(1, MessageKey.ValidationFailed),
  name: z.string().trim().min(1, MessageKey.ValidationFailed).max(80, MessageKey.ValidationFailed),
  status: z.enum(["AVAILABLE", "OCCUPIED", "DISABLED"])
});

export type TableFormValues = z.infer<typeof tableSchema>;
