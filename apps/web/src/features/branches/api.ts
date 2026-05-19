import { httpRequest } from "../../lib/api/http";
import type { BranchFormRequest, BranchResponse, ListBranchesResponse } from "../../lib/api/types";

export const branchesApi = {
  list: (token: string) => httpRequest<ListBranchesResponse>("/admin/branches", { token }),
  create: (token: string, body: BranchFormRequest) =>
    httpRequest<BranchResponse>("/admin/branches", { method: "POST", token, body: JSON.stringify(body) }),
  update: (token: string, branchId: string, body: BranchFormRequest) =>
    httpRequest<BranchResponse>(`/admin/branches/${branchId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body)
    }),
  delete: (token: string, branchId: string) =>
    httpRequest<{ branchId: string }>(`/admin/branches/${branchId}`, {
      method: "DELETE",
      token
    })
};
