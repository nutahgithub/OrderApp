import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./shared/http/error-handler.js";
import { notFoundHandler } from "./shared/http/not-found.js";
import { requestContext, requestLogger } from "./shared/logger/request-logger.js";

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin"
      }
    })
  );
  app.use(
    cors({
      origin: env.WEB_APP_URL,
      credentials: true
    })
  );
  app.use(requestContext);
  app.use(express.json({ limit: "2mb" }));
  app.use(env.LOCAL_UPLOAD_PUBLIC_PATH, express.static(path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR)));
  app.use(requestLogger);

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
