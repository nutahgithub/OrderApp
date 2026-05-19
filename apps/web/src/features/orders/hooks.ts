import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderStatus, UpdateOrderStatusRequest } from "../../lib/api/types";
import { queryKeys } from "../../lib/query/query-keys";
import { ordersApi } from "./api";
import type { ListOrdersParams } from "./api";

export const useOrdersQuery = (token: string | null, input: Omit<ListOrdersParams, "status"> & { status: OrderStatus | "ALL" }) => {
  const apiStatus = input.status === "ALL" ? undefined : input.status;

  return useQuery({
    queryKey: queryKeys.orders(input.branchId, apiStatus, {
      startDate: input.startDate,
      endDate: input.endDate,
      page: input.page,
      pageSize: input.pageSize
    }),
    queryFn: () => ordersApi.list(token ?? "", { ...input, status: apiStatus }),
    enabled: Boolean(token && input.branchId)
  });
};

export const useOrderQuery = (token: string | null, orderId: string) => {
  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => ordersApi.get(token ?? "", orderId),
    enabled: Boolean(token && orderId)
  });
};

export const useUpdateOrderStatusMutation = (token: string | null, branchId: string, status: OrderStatus | "ALL") => {
  const queryClient = useQueryClient();
  const apiStatus = status === "ALL" ? undefined : status;

  return useMutation({
    mutationFn: (input: { orderId: string; status: UpdateOrderStatusRequest["status"] }) =>
      ordersApi.updateStatus(token ?? "", input.orderId, { status: input.status }),
    onSuccess: (data, input) => {
      queryClient.setQueryData(queryKeys.order(input.orderId), data);
      void queryClient.invalidateQueries({ queryKey: ["orders", branchId, apiStatus ?? "ALL"] });
    }
  });
};

export const useConfirmPaymentMutation = (token: string | null, branchId: string, status: OrderStatus | "ALL") => {
  const queryClient = useQueryClient();
  const apiStatus = status === "ALL" ? undefined : status;

  return useMutation({
    mutationFn: (input: { orderId: string; amount: string }) =>
      ordersApi.confirmPayment(token ?? "", input.orderId, { amount: input.amount, method: "CASH" }),
    onSuccess: (data, input) => {
      queryClient.setQueryData(queryKeys.order(input.orderId), { order: data.order });
      void queryClient.invalidateQueries({ queryKey: ["orders", branchId, apiStatus ?? "ALL"] });
    }
  });
};
