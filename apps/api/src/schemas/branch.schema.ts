import { z } from "zod";

export const branchParamsSchema = z.object({
  branchId: z.string().min(1)
});

export const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

export const updateBranchSchema = createBranchSchema;
