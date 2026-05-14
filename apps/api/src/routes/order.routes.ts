import { Router } from "express";
import { getOrderController, listOrdersController, updateOrderStatusController } from "../controllers/order.controller.js";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const orderRouter = Router();

orderRouter.use(requireAdminAuth);
orderRouter.get("/", asyncHandler(listOrdersController));
orderRouter.get("/:orderId", asyncHandler(getOrderController));
orderRouter.patch("/:orderId/status", asyncHandler(updateOrderStatusController));
