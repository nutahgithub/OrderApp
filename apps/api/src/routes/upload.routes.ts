import { Router } from "express";
import { uploadMenuImageController } from "../controllers/upload.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { menuImageUploadRateLimit } from "../middlewares/rate-limit.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const uploadRouter = Router();

uploadRouter.use(requireAdminAuth);
uploadRouter.post("/menu-images", menuImageUploadRateLimit, asyncHandler(uploadMenuImageController));
