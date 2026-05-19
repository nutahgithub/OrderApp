import type { Request, Response } from "express";
import { getHealthStatus, getObservabilitySnapshot, getReadinessStatus } from "../services/health.service.js";
import { ok } from "../shared/http/api-response.js";

export const getHealthController = async (_request: Request, response: Response) => {
  ok(response, getHealthStatus());
};

export const getReadinessController = async (_request: Request, response: Response) => {
  const readiness = await getReadinessStatus();

  response.status(readiness.status === "ready" ? 200 : 503);
  ok(response, readiness);
};

export const getMetricsController = async (_request: Request, response: Response) => {
  ok(response, getObservabilitySnapshot());
};
