import { Router } from "express";
import { createCustomerOrderController, getCustomerOrderSummaryController } from "../controllers/order.controller.js";
import { asyncHandler } from "../shared/http/async-handler.js";

export const publicOrderRouter = Router();

publicOrderRouter.post("/:tenantId/:branchId/:tableId/orders", asyncHandler(createCustomerOrderController));
publicOrderRouter.get("/:tenantId/:branchId/:tableId/orders/:orderId", asyncHandler(getCustomerOrderSummaryController));
