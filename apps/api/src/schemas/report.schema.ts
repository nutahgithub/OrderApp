import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reportDashboardQuerySchema = z
  .object({
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
    branchId: z.string().min(1).optional()
  })
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return value.startDate <= value.endDate;
    },
    {
      message: "startDate must be before or equal to endDate",
      path: ["startDate"]
    }
  );
