import { Router } from "express";
import { getReportDashboardController } from "../controllers/report.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const reportRouter = Router();

reportRouter.use(requireAdminAuth);
reportRouter.get("/dashboard", requireAdminRole("MANAGER"), asyncHandler(getReportDashboardController));
