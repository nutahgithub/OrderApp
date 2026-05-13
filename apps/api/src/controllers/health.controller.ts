import type { RequestHandler } from "express";
import { ok } from "../shared/http/api-response.js";

export const getHealthController: RequestHandler = (_request, response) => {
  ok(response, {
    status: "ok",
    service: "smart-restaurant-os-api"
  });
};

