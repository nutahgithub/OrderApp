import { httpRequest } from "../../lib/api/http";
import type {
  ConfirmPaymentRequest,
  ListOrdersResponse,
  OrderResponse,
  OrderStatus,
  PaymentResponse,
  UpdateOrderStatusRequest
} from "../../lib/api/types";

export type ListOrdersParams = {
  branchId: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export const ordersApi = {
  list: (token: string, input: ListOrdersParams) => {
    const params = new URLSearchParams({ branchId: input.branchId });

    if (input.status) {
      params.set("status", input.status);
    }

    if (input.startDate) {
      params.set("startDate", input.startDate);
    }

    if (input.endDate) {
      params.set("endDate", input.endDate);
    }

    if (input.page) {
      params.set("page", String(input.page));
    }

    if (input.pageSize) {
      params.set("pageSize", String(input.pageSize));
    }

    return httpRequest<ListOrdersResponse>(`/admin/orders?${params.toString()}`, { token });
  },
  get: (token: string, orderId: string) => httpRequest<OrderResponse>(`/admin/orders/${orderId}`, { token }),
  updateStatus: (token: string, orderId: string, body: UpdateOrderStatusRequest) =>
    httpRequest<OrderResponse>(`/admin/orders/${orderId}/status`, { method: "PATCH", token, body: JSON.stringify(body) }),
  confirmPayment: (token: string, orderId: string, body: ConfirmPaymentRequest) =>
    httpRequest<PaymentResponse>(`/admin/orders/${orderId}/payment`, { method: "POST", token, body: JSON.stringify(body) })
};
