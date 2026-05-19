import { httpRequest } from "../../lib/api/http";
import type { CurrentAdminResponse, LoginRequest, LoginResponse } from "../../lib/api/types";

export const authApi = {
  loginAdmin: (body: LoginRequest) =>
    httpRequest<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getCurrentAdmin: (token: string) => httpRequest<CurrentAdminResponse>("/admin/auth/me", { token })
};
