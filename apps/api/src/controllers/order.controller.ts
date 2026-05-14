import type { Request, Response } from "express";
import {
  createCustomerOrderSchema,
  orderQrParamsSchema,
  orderSummaryParamsSchema
} from "../schemas/order.schema.js";
import { createCustomerOrder, getCustomerOrderSummary } from "../services/order.service.js";
import { created, ok } from "../shared/http/api-response.js";
import { parseBody, parseParams } from "../shared/http/validation.js";

export const createCustomerOrderController = async (request: Request, response: Response) => {
  const params = parseParams(request, orderQrParamsSchema);
  const input = parseBody(request, createCustomerOrderSchema);
  const order = await createCustomerOrder(params.tenantId, params.branchId, params.tableId, input);

  created(response, {
    order
  });
};

export const getCustomerOrderSummaryController = async (request: Request, response: Response) => {
  const params = parseParams(request, orderSummaryParamsSchema);
  const order = await getCustomerOrderSummary(params.tenantId, params.branchId, params.tableId, params.orderId);

  ok(response, {
    order
  });
};
