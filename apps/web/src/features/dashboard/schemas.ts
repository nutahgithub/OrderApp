import { z } from "zod";
import { MessageKey } from "../../lib/i18n/messages";

export const dashboardFilterSchema = z
  .object({
    startDate: z.string().min(1, MessageKey.ValidationFailed),
    endDate: z.string().min(1, MessageKey.ValidationFailed),
    branchId: z.string()
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: MessageKey.ValidationFailed,
    path: ["endDate"]
  });

export type DashboardFilterValues = z.infer<typeof dashboardFilterSchema>;
