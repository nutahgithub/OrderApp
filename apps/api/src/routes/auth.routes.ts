import { Router } from "express";
import { getCurrentAdminController, loginAdminController } from "../controllers/auth.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginAdminController));
authRouter.get("/me", requireAdminAuth, asyncHandler(getCurrentAdminController));
