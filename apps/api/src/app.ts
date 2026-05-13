import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./shared/http/error-handler.js";
import { notFoundHandler } from "./shared/http/not-found.js";
import { requestLogger } from "./shared/logger/request-logger.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_APP_URL,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  app.use("/health", healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

