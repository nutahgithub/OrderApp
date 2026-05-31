import { httpRequest } from "../../lib/api/http";
import type {
  AdminUserResponse,
  CreateAdminUserRequest,
  ListAdminUsersResponse,
  ResetAdminPasswordRequest,
  UpdateAdminUserRequest
} from "../../lib/api/types";

export const adminUsersApi = {
  list: (token: string) => httpRequest<ListAdminUsersResponse>("/admin/users", { token }),
  create: (token: string, body: CreateAdminUserRequest) =>
    httpRequest<AdminUserResponse>("/admin/users", { method: "POST", token, body: JSON.stringify(body) }),
  update: (token: string, adminId: string, body: UpdateAdminUserRequest) =>
    httpRequest<AdminUserResponse>(`/admin/users/${adminId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body)
    }),
  resetPassword: (token: string, adminId: string, body: ResetAdminPasswordRequest) =>
    httpRequest<AdminUserResponse>(`/admin/users/${adminId}/password`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body)
    })
};
