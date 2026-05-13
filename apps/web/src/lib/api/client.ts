import type {
  ApiErrorBody,
  ApiSuccessBody,
  CurrentAdminResponse,
  HealthResponse,
  LoginRequest,
  LoginResponse
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
    })
};
