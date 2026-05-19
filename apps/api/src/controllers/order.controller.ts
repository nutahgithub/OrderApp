import type { Request, Response } from "express";
import {
  createQrOrderSchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  qrOrderDetailParamsSchema,
  qrOrderParamsSchema,
  updateOrderStatusSchema
} from "../schemas/order.schema.js";
import { confirmPaymentSchema } from "../schemas/payment.schema.js";
import {
  createQrOrder,
  getQrOrderDetail,
  getTenantOrderDetail,
  listTenantOrders,
  updateTenantOrderStatus
} from "../services/order.service.js";
import { confirmTenantOrderPayment } from "../services/payment.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams, parseQuery } from "../shared/http/validation.js";

const getTenantId = (request: Request): string => {
  if (!request.auth) {
    throw new AppError(ErrorCode.MissingAuthContext);
  }

  return request.auth.tenantId;
};

export const listOrdersController = async (request: Request, response: Response) => {
  const query = parseQuery(request, listOrdersQuerySchema);
  const result = await listTenantOrders(getTenantId(request), query);

  ok(response, {
    orders: result.orders,
    pagination: result.pagination
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

export const confirmPaymentController = async (request: Request, response: Response) => {
  const params = parseParams(request, orderParamsSchema);
  const input = parseBody(request, confirmPaymentSchema);
  const paymentResult = await confirmTenantOrderPayment(getTenantId(request), params.orderId, input);

  ok(response, paymentResult);
};

export const createQrOrderController = async (request: Request, response: Response) => {
  const params = parseParams(request, qrOrderParamsSchema);
  const input = parseBody(request, createQrOrderSchema);
  const order = await createQrOrder(params.tenantId, params.branchId, params.tableId, input);

  created(response, {
    order
  });
};

export const getQrOrderController = async (request: Request, response: Response) => {
  const params = parseParams(request, qrOrderDetailParamsSchema);
  const order = await getQrOrderDetail(params.tenantId, params.branchId, params.tableId, params.orderId);

  ok(response, {
    order
  });
};
