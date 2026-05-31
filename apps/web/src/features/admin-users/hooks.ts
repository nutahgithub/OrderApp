import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateAdminUserRequest, ResetAdminPasswordRequest, UpdateAdminUserRequest } from "../../lib/api/types";
import { queryKeys } from "../../lib/query/query-keys";
import { adminUsersApi } from "./api";

export const useAdminUsersQuery = (token: string | null) => {
  return useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: () => adminUsersApi.list(token ?? ""),
    enabled: Boolean(token)
  });
};

export const useCreateAdminUserMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateAdminUserRequest) => adminUsersApi.create(token ?? "", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    }
  });
};

export const useUpdateAdminUserMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { adminId: string; body: UpdateAdminUserRequest }) =>
      adminUsersApi.update(token ?? "", input.adminId, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    }
  });
};

export const useResetAdminPasswordMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { adminId: string; body: ResetAdminPasswordRequest }) =>
      adminUsersApi.resetPassword(token ?? "", input.adminId, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    }
  });
};
