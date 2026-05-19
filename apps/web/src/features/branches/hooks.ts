import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { branchesApi } from "./api";

export const useBranchesQuery = (token: string | null) => {
  return useQuery({
    queryKey: queryKeys.branches(),
    queryFn: () => branchesApi.list(token ?? ""),
    enabled: Boolean(token)
  });
};

export const useCreateBranchMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string }) => branchesApi.create(token ?? "", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches() });
    }
  });
};

export const useUpdateBranchMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { branchId: string; body: { name: string } }) =>
      branchesApi.update(token ?? "", input.branchId, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches() });
    }
  });
};

export const useDeleteBranchMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchId: string) => branchesApi.delete(token ?? "", branchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches() });
    }
  });
};
