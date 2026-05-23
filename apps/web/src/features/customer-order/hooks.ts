import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { qrApi } from "./api";

export const useQrEntryQuery = (tenantId: string, branchId: string, tableId: string) => {
  return useQuery({
    queryKey: queryKeys.qrEntry(tenantId, branchId, tableId),
    queryFn: () => qrApi.getEntry(tenantId, branchId, tableId),
    enabled: Boolean(tenantId && branchId && tableId)
  });
};

export const useQrMenusQuery = (tenantId: string, branchId: string, tableId: string, enabled: boolean) => {
  return useQuery({
    queryKey: queryKeys.qrMenus(tenantId, branchId, tableId),
    queryFn: () => qrApi.listMenus(tenantId, branchId, tableId),
    enabled: Boolean(enabled && tenantId && branchId && tableId)
  });
};

export const useCreateQrOrderMutation = (tenantId: string, branchId: string, tableId: string) => {
  return useMutation({
    mutationFn: (input: { body: Parameters<typeof qrApi.createOrder>[3]; idempotencyKey: string }) =>
      qrApi.createOrder(tenantId, branchId, tableId, input.body, input.idempotencyKey)
  });
};

export const useQrOrderRefresh = (tenantId: string, branchId: string, tableId: string, orderId: string) => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.fetchQuery({
      queryKey: queryKeys.qrOrder(tenantId, branchId, tableId, orderId),
      queryFn: () => qrApi.getOrder(tenantId, branchId, tableId, orderId)
    });
};
