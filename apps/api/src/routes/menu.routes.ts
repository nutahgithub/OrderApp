import { Router } from "express";
import {
  createMenuController,
  deleteMenuController,
  listMenusController,
  listPublicQrMenusController,
  updateMenuController
} from "../controllers/menu.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const menuRouter = Router();

menuRouter.use(requireAdminAuth);
menuRouter.get("/", asyncHandler(listMenusController));
menuRouter.post("/", asyncHandler(createMenuController));
menuRouter.patch("/:menuId", asyncHandler(updateMenuController));
menuRouter.delete("/:menuId", asyncHandler(deleteMenuController));

export const publicMenuRouter = Router();

publicMenuRouter.get("/:tenantId/:branchId/:tableId/menu", asyncHandler(listPublicQrMenusController));
