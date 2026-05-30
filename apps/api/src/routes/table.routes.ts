import { Router } from "express";
import {
  createTableController,
  getQrEntryController,
  listTablesController,
  updateTableController
} from "../controllers/table.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const tableRouter = Router();

tableRouter.use(requireAdminAuth);
tableRouter.get("/", asyncHandler(listTablesController));
tableRouter.post("/", requireAdminRole("MANAGER"), asyncHandler(createTableController));
tableRouter.patch("/:tableId", requireAdminRole("MANAGER"), asyncHandler(updateTableController));

export const qrRouter = Router();

qrRouter.get("/:tenantId/:branchId/:tableId", asyncHandler(getQrEntryController));
