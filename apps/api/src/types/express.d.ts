import type { AdminSession } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AdminSession;
      requestId?: string;
    }
  }
}

export {};
