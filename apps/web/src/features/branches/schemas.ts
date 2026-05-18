import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const branchSchema = z.object({
  name: z.string().trim().min(2, MessageKey.ValidationFailed).max(120, MessageKey.ValidationFailed)
});

export type BranchFormValues = z.infer<typeof branchSchema>;
