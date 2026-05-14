import type { Request, Response } from "express";
import { listOrdersQuerySchema, orderParamsSchema, updateOrderStatusSchema } from "../schemas/order.schema.js";
import { getTenantOrderDetail, listTenantOrders, updateTenantOrderStatus } from "../services/order.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { ok } from "../shared/http/api-response.js";
import { parseBody, parseParams, parseQuery } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const listOrdersController = async (request: Request, response: Response) => {
  const query = parseQuery(request, listOrdersQuerySchema);
  const orders = await listTenantOrders(getTenantId(request), query);

  ok(response, {
    orders
  });
};

export const getOrderController = async (request: Request, response: Response) => {
  const params = parseParams(request, orderParamsSchema);
  const order = await getTenantOrderDetail(getTenantId(request), params.orderId);

  ok(response, {
    order
  });
};

export const updateOrderStatusController = async (request: Request, response: Response) => {
  const params = parseParams(request, orderParamsSchema);
  const input = parseBody(request, updateOrderStatusSchema);
  const order = await updateTenantOrderStatus(getTenantId(request), params.orderId, input);

  ok(response, {
    order
  });
};
