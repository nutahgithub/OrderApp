import { httpRequest } from "../../lib/api/http";
import type {
  ConfirmPaymentRequest,
  ListOrdersResponse,
  OrderResponse,
  OrderStatus,
  PaymentResponse,
  UpdateOrderStatusRequest
} from "../../lib/api/types";

export const ordersApi = {
  list: (token: string, branchId: string, status?: OrderStatus) => {
    const params = new URLSearchParams({ branchId });

    if (status) {
      params.set("status", status);
    }

    return httpRequest<ListOrdersResponse>(`/admin/orders?${params.toString()}`, { token });
  },
  get: (token: string, orderId: string) => httpRequest<OrderResponse>(`/admin/orders/${orderId}`, { token }),
  updateStatus: (token: string, orderId: string, body: UpdateOrderStatusRequest) =>
    httpRequest<OrderResponse>(`/admin/orders/${orderId}/status`, { method: "PATCH", token, body: JSON.stringify(body) }),
  confirmPayment: (token: string, orderId: string, body: ConfirmPaymentRequest) =>
    httpRequest<PaymentResponse>(`/admin/orders/${orderId}/payment`, { method: "POST", token, body: JSON.stringify(body) })
};
