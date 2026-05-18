import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTableRequest } from "../../lib/api/types";
import { queryKeys } from "../../lib/query/query-keys";
import { tablesApi } from "./api";

export const useTablesQuery = (token: string | null, branchId: string) => {
  return useQuery({
    queryKey: queryKeys.tables(branchId),
    queryFn: () => tablesApi.list(token ?? "", branchId),
    enabled: Boolean(token && branchId)
  });
};

export const useCreateTableMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTableRequest) => tablesApi.create(token ?? "", body),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables(input.branchId) });
    }
  });
};

export const useUpdateTableMutation = (token: string | null, branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tableId: string; body: { name: string; status: "AVAILABLE" | "OCCUPIED" | "DISABLED" } }) =>
      tablesApi.update(token ?? "", input.tableId, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables(branchId) });
    }
  });
};
