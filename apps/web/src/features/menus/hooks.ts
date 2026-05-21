import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { menusApi } from "./api";

export const useMenusQuery = (token: string | null) => {
  return useQuery({
    queryKey: queryKeys.menus(),
    queryFn: () => menusApi.list(token ?? ""),
    enabled: Boolean(token)
  });
};

export const useCreateMenuMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: menusApi.create.bind(null, token ?? ""),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menus() });
    }
  });
};

export const useUpdateMenuMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { menuId: string; body: Parameters<typeof menusApi.update>[2] }) =>
      menusApi.update(token ?? "", input.menuId, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menus() });
    }
  });
};

export const useDeleteMenuMutation = (token: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: menusApi.delete.bind(null, token ?? ""),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menus() });
    }
  });
};

export const useUploadMenuImageMutation = (token: string | null) => {
  return useMutation({
    mutationFn: menusApi.uploadImage.bind(null, token ?? "")
  });
};
