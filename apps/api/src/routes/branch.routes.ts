import { Router } from "express";
import {
  createBranchController,
  deleteBranchController,
  listBranchesController,
  updateBranchController
} from "../controllers/branch.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const branchRouter = Router();

branchRouter.use(requireAdminAuth);
branchRouter.get("/", asyncHandler(listBranchesController));
branchRouter.post("/", requireAdminRole("MANAGER"), asyncHandler(createBranchController));
branchRouter.patch("/:branchId", requireAdminRole("MANAGER"), asyncHandler(updateBranchController));
branchRouter.delete("/:branchId", requireAdminRole("MANAGER"), asyncHandler(deleteBranchController));
