import { Router } from "express";
import {
  createMenuCategoryController,
  createMenuController,
  deleteMenuCategoryController,
  deleteMenuController,
  listMenuCategoriesController,
  listMenusController,
  listPublicQrMenusController,
  updateMenuCategoryController,
  updateMenuController
} from "../controllers/menu.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const menuRouter = Router();

menuRouter.use(requireAdminAuth);
menuRouter.get("/", asyncHandler(listMenusController));
menuRouter.get("/categories", asyncHandler(listMenuCategoriesController));
menuRouter.post("/categories", requireAdminRole("MANAGER"), asyncHandler(createMenuCategoryController));
menuRouter.patch("/categories/:categoryId", requireAdminRole("MANAGER"), asyncHandler(updateMenuCategoryController));
menuRouter.delete("/categories/:categoryId", requireAdminRole("MANAGER"), asyncHandler(deleteMenuCategoryController));
menuRouter.post("/", requireAdminRole("MANAGER"), asyncHandler(createMenuController));
menuRouter.patch("/:menuId", requireAdminRole("MANAGER"), asyncHandler(updateMenuController));
menuRouter.delete("/:menuId", requireAdminRole("MANAGER"), asyncHandler(deleteMenuController));

export const publicMenuRouter = Router();

publicMenuRouter.get("/:tenantId/:branchId/:tableId/menu", asyncHandler(listPublicQrMenusController));
