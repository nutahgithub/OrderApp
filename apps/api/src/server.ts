import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";
import { initRealtimeServer } from "./shared/realtime/socket.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info("api_listening", {
    port: env.PORT
  });
});

initRealtimeServer(server);
