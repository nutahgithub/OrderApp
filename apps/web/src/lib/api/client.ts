import type {
  ApiErrorBody,
  ApiSuccessBody,
  BranchFormRequest,
  BranchResponse,
  CurrentAdminResponse,
  CreateMenuRequest,
  CreateTableRequest,
  HealthResponse,
  ListBranchesResponse,
  ListMenusResponse,
  ListTablesResponse,
  LoginRequest,
  LoginResponse,
  MenuFormRequest,
  MenuResponse,
  QrEntryResponse,
  TableFormRequest,
  TableResponse,
  UploadImageRequest,
  UploadImageResponse
} from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const parseApiError = async (response: Response): Promise<ApiClientError> => {
  const fallback = new ApiClientError("Request failed", response.status, "REQUEST_FAILED");

  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiClientError(body.error.message, response.status, body.error.code);
  } catch {
    return fallback;
  }
};

const request = async <TResponse>(path: string, init?: RequestInit): Promise<TResponse> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const body = (await response.json()) as ApiSuccessBody<TResponse>;

  return body.data;
};

export const apiClient = {
  health: () => request<HealthResponse>("/health"),
  loginAdmin: (body: LoginRequest) =>
    request<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getCurrentAdmin: (token: string) =>
    request<CurrentAdminResponse>("/admin/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  listBranches: (token: string) =>
    request<ListBranchesResponse>("/admin/branches", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  createBranch: (token: string, body: BranchFormRequest) =>
    request<BranchResponse>("/admin/branches", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  updateBranch: (token: string, branchId: string, body: BranchFormRequest) =>
    request<BranchResponse>(`/admin/branches/${branchId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  listTables: (token: string, branchId: string) =>
    request<ListTablesResponse>(`/admin/tables?branchId=${encodeURIComponent(branchId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  createTable: (token: string, body: CreateTableRequest) =>
    request<TableResponse>("/admin/tables", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  updateTable: (token: string, tableId: string, body: TableFormRequest) =>
    request<TableResponse>(`/admin/tables/${tableId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: body.name,
        status: body.status
      })
    }),
  listMenus: (token: string) =>
    request<ListMenusResponse>("/admin/menus", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  createMenu: (token: string, body: CreateMenuRequest) =>
    request<MenuResponse>("/admin/menus", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  updateMenu: (token: string, menuId: string, body: MenuFormRequest) =>
    request<MenuResponse>(`/admin/menus/${menuId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  uploadMenuImage: (token: string, body: UploadImageRequest) =>
    request<UploadImageResponse>("/admin/uploads/menu-images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }),
  getQrEntry: (tenantId: string, branchId: string, tableId: string) =>
    request<QrEntryResponse>(
      `/qr/${encodeURIComponent(tenantId)}/${encodeURIComponent(branchId)}/${encodeURIComponent(tableId)}`
    ),
  listPublicMenus: (tenantId: string, branchId: string, tableId: string) =>
    request<ListMenusResponse>(
      `/qr/${encodeURIComponent(tenantId)}/${encodeURIComponent(branchId)}/${encodeURIComponent(tableId)}/menu`
    )
};
