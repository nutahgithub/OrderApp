import { ApiClientError } from "./client";
import type { ApiErrorBody, ApiSuccessBody } from "./types";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type HttpRequestOptions = RequestInit & {
  token?: string | null;
};

const parseApiError = async (response: Response): Promise<ApiClientError> => {
  const fallback = new ApiClientError("Request failed", response.status, "REQUEST_FAILED");

  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiClientError(body.error.message, response.status, body.error.code);
  } catch {
    return fallback;
  }
};

export const httpRequest = async <TResponse>(path: string, options: HttpRequestOptions = {}): Promise<TResponse> => {
  const { token, headers, ...init } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const body = (await response.json()) as ApiSuccessBody<TResponse>;

  return body.data;
};
