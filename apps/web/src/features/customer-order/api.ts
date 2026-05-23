import { httpRequest } from "../../lib/api/http";
import type { CreateQrOrderRequest, ListMenusResponse, OrderResponse, QrEntryResponse } from "../../lib/api/types";

const qrPath = (tenantId: string, branchId: string, tableId: string): string =>
  `/qr/${encodeURIComponent(tenantId)}/${encodeURIComponent(branchId)}/${encodeURIComponent(tableId)}`;

export const qrApi = {
  getEntry: (tenantId: string, branchId: string, tableId: string) =>
    httpRequest<QrEntryResponse>(qrPath(tenantId, branchId, tableId)),
  listMenus: (tenantId: string, branchId: string, tableId: string) =>
    httpRequest<ListMenusResponse>(`${qrPath(tenantId, branchId, tableId)}/menu`),
  createOrder: (tenantId: string, branchId: string, tableId: string, body: CreateQrOrderRequest, idempotencyKey: string) =>
    httpRequest<OrderResponse>(`${qrPath(tenantId, branchId, tableId)}/orders`, {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(body)
    }),
  getOrder: (tenantId: string, branchId: string, tableId: string, orderId: string) =>
    httpRequest<OrderResponse>(`${qrPath(tenantId, branchId, tableId)}/orders/${encodeURIComponent(orderId)}`)
};
