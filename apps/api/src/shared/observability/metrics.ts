type HttpMetricKey = `${string} ${string} ${number}`;

export type HttpMetric = {
  method: string;
  path: string;
  statusCode: number;
  count: number;
  averageDurationMs: number;
  maxDurationMs: number;
};

export type MetricsSnapshot = {
  startedAt: string;
  uptimeSeconds: number;
  http: {
    requestCount: number;
    errorCount: number;
    averageDurationMs: number;
    routes: HttpMetric[];
  };
  business: {
    orderCreatedCount: number;
  };
};

type MutableHttpMetric = {
  method: string;
  path: string;
  statusCode: number;
  count: number;
  totalDurationMs: number;
  maxDurationMs: number;
};

const startedAt = new Date();
const routeMetrics = new Map<HttpMetricKey, MutableHttpMetric>();

let requestCount = 0;
let errorCount = 0;
let totalDurationMs = 0;
let orderCreatedCount = 0;

const normalizePath = (path: string): string => {
  return path.split("?")[0] || path;
};

export const recordHttpRequest = (input: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}): void => {
  requestCount += 1;
  totalDurationMs += input.durationMs;

  if (input.statusCode >= 500) {
    errorCount += 1;
  }

  const path = normalizePath(input.path);
  const key: HttpMetricKey = `${input.method} ${path} ${input.statusCode}`;
  const current = routeMetrics.get(key);

  if (current) {
    current.count += 1;
    current.totalDurationMs += input.durationMs;
    current.maxDurationMs = Math.max(current.maxDurationMs, input.durationMs);
    return;
  }

  routeMetrics.set(key, {
    method: input.method,
    path,
    statusCode: input.statusCode,
    count: 1,
    totalDurationMs: input.durationMs,
    maxDurationMs: input.durationMs
  });
};

export const recordOrderCreated = (): void => {
  orderCreatedCount += 1;
};

export const getMetricsSnapshot = (): MetricsSnapshot => {
  const averageDurationMs = requestCount === 0 ? 0 : totalDurationMs / requestCount;
  const routes = [...routeMetrics.values()]
    .map((metric) => ({
      method: metric.method,
      path: metric.path,
      statusCode: metric.statusCode,
      count: metric.count,
      averageDurationMs: Math.round(metric.totalDurationMs / metric.count),
      maxDurationMs: Math.round(metric.maxDurationMs)
    }))
    .sort((left, right) => right.count - left.count);

  return {
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    http: {
      requestCount,
      errorCount,
      averageDurationMs: Math.round(averageDurationMs),
      routes
    },
    business: {
      orderCreatedCount
    }
  };
};
