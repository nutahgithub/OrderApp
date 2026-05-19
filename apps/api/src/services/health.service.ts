import { env } from "../config/env.js";
import { prisma } from "../shared/prisma/client.js";
import { getMetricsSnapshot } from "../shared/observability/metrics.js";
import type { MetricsSnapshot } from "../shared/observability/metrics.js";

export type HealthStatusDto = {
  status: "ok";
  service: "smart-restaurant-os-api";
  environment: string;
  uptimeSeconds: number;
};

export type ReadinessStatusDto = {
  status: "ready" | "degraded";
  service: "smart-restaurant-os-api";
  checks: {
    database: "ok" | "error";
  };
};

export const getHealthStatus = (): HealthStatusDto => {
  return {
    status: "ok",
    service: "smart-restaurant-os-api",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime())
  };
};

export const getReadinessStatus = async (): Promise<ReadinessStatusDto> => {
  try {
    await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;

    return {
      status: "ready",
      service: "smart-restaurant-os-api",
      checks: {
        database: "ok"
      }
    };
  } catch {
    return {
      status: "degraded",
      service: "smart-restaurant-os-api",
      checks: {
        database: "error"
      }
    };
  }
};

export const getObservabilitySnapshot = (): MetricsSnapshot => {
  return getMetricsSnapshot();
};
