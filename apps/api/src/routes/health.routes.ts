import { Router } from "express";
import {
  getHealthController,
  getMetricsController,
  getReadinessController
} from "../controllers/health.controller.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const healthRouter = Router();

healthRouter.get("/", asyncHandler(getHealthController));
healthRouter.get("/ready", asyncHandler(getReadinessController));
healthRouter.get("/metrics", asyncHandler(getMetricsController));
