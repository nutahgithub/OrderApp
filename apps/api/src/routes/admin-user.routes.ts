import { Router } from "express";
import {
  createAdminUserController,
  listAdminUsersController,
  resetAdminPasswordController,
  updateAdminUserController
} from "../controllers/admin-user.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const adminUserRouter = Router();

adminUserRouter.use(requireAdminAuth);
adminUserRouter.use(requireAdminRole("MANAGER"));
adminUserRouter.get("/", asyncHandler(listAdminUsersController));
adminUserRouter.post("/", asyncHandler(createAdminUserController));
adminUserRouter.patch("/:adminId", asyncHandler(updateAdminUserController));
adminUserRouter.patch("/:adminId/password", asyncHandler(resetAdminPasswordController));
