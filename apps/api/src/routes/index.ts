import type { Express } from "express";
import { authRouter } from "./auth.routes.js";
import { branchRouter } from "./branch.routes.js";
import { healthRouter } from "./health.routes.js";
import { qrRouter, tableRouter } from "./table.routes.js";

export const registerRoutes = (app: Express): void => {
  app.use("/health", healthRouter);
  app.use("/admin/auth", authRouter);
  app.use("/admin/branches", branchRouter);
  app.use("/admin/tables", tableRouter);
  app.use("/qr", qrRouter);
};
