import { createHash } from "node:crypto";
import { env } from "../../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const logLevelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLogLevel: LogLevel = env.NODE_ENV === "test" && !process.env.LOG_LEVEL ? "warn" : env.LOG_LEVEL;

const shouldLog = (level: LogLevel): boolean => {
  return logLevelPriority[level] >= logLevelPriority[configuredLogLevel];
};

const serializeError = (error: Error): LogContext => {
  return {
    name: error.name,
    message: error.message,
    stack: env.NODE_ENV === "production" ? undefined : error.stack
  };
};

const writeLog = (level: LogLevel, message: string, context: LogContext = {}): void => {
  if (!shouldLog(level)) {
    return;
  }

  const record = {
    timestamp: new Date().toISOString(),
    level,
    service: "smart-restaurant-os-api",
    environment: env.NODE_ENV,
    message,
    ...context
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  debug: (message: string, context?: LogContext): void => writeLog("debug", message, context),
  info: (message: string, context?: LogContext): void => writeLog("info", message, context),
  warn: (message: string, context?: LogContext): void => writeLog("warn", message, context),
  error: (message: string, error?: Error, context?: LogContext): void =>
    writeLog("error", message, {
      ...context,
      ...(error ? { error: serializeError(error) } : {})
    })
};

export const hashForLog = (value: string): string => {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
};
