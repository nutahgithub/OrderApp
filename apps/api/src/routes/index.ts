import type { Express } from "express";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";

export const registerRoutes = (app: Express): void => {
  app.use("/health", healthRouter);
  app.use("/admin/auth", authRouter);
};

