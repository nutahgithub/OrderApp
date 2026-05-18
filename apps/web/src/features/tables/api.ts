import { httpRequest } from "../../lib/api/http";
import type { CreateTableRequest, ListTablesResponse, TableFormRequest, TableResponse } from "../../lib/api/types";

export const tablesApi = {
  list: (token: string, branchId: string) =>
    httpRequest<ListTablesResponse>(`/admin/tables?branchId=${encodeURIComponent(branchId)}`, { token }),
  create: (token: string, body: CreateTableRequest) =>
    httpRequest<TableResponse>("/admin/tables", { method: "POST", token, body: JSON.stringify(body) }),
  update: (token: string, tableId: string, body: TableFormRequest) =>
    httpRequest<TableResponse>(`/admin/tables/${tableId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name: body.name, status: body.status })
    })
};
