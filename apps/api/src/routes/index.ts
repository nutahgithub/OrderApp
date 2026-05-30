import type { Express } from "express";
import { auditLogRouter } from "./audit-log.routes.js";
import { authRouter } from "./auth.routes.js";
import { branchRouter } from "./branch.routes.js";
import { healthRouter } from "./health.routes.js";
import { menuRouter, publicMenuRouter } from "./menu.routes.js";
import { orderRouter, publicOrderRouter } from "./order.routes.js";
import { reportRouter } from "./report.routes.js";
import { qrRouter, tableRouter } from "./table.routes.js";
import { uploadRouter } from "./upload.routes.js";

export const registerRoutes = (app: Express): void => {
  app.use("/health", healthRouter);
  app.use("/admin/auth", authRouter);
  app.use("/admin/audit-logs", auditLogRouter);
  app.use("/admin/branches", branchRouter);
  app.use("/admin/tables", tableRouter);
  app.use("/admin/menus", menuRouter);
  app.use("/admin/orders", orderRouter);
  app.use("/admin/reports", reportRouter);
  app.use("/admin/uploads", uploadRouter);
  app.use("/qr", qrRouter);
  app.use("/qr", publicMenuRouter);
  app.use("/qr", publicOrderRouter);
};
