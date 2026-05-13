import { Router } from "express";
import {
  createBranchController,
  listBranchesController,
  updateBranchController
} from "../controllers/branch.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const branchRouter = Router();

branchRouter.use(requireAdminAuth);
branchRouter.get("/", asyncHandler(listBranchesController));
branchRouter.post("/", asyncHandler(createBranchController));
branchRouter.patch("/:branchId", asyncHandler(updateBranchController));
