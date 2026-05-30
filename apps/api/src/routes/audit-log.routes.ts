import { Router } from "express";
import { listAuditLogsController } from "../controllers/audit-log.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { requireAdminRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const auditLogRouter = Router();

auditLogRouter.use(requireAdminAuth);
auditLogRouter.get("/", requireAdminRole("MANAGER"), asyncHandler(listAuditLogsController));
